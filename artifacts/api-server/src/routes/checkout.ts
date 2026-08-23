import crypto from "node:crypto";
import { Router, type IRouter, type Request, type Response } from "express";
import {
  db,
  eq,
  productOverridesTable,
  productsTable,
  stockBatchesTable,
  companiesTable,
  prescriptionUploadsTable,
  sql,
} from "@workspace/db";
import { requireUserRequest } from "../lib/firebase-admin";

const router: IRouter = Router();
const MAX_QUANTITY = 99;
const MAX_PRESCRIPTION_BYTES = 10 * 1024 * 1024;
const ALLOWED_PRESCRIPTION_TYPES = new Set(["image/jpeg", "image/png", "application/pdf"]);

async function customerGuard(req: Request, res: Response) {
  try {
    return await requireUserRequest(req.header("authorization"));
  } catch (error) {
    res.status(error instanceof Error && error.message.includes("not configured") ? 503 : 401)
      .json({ error: error instanceof Error ? error.message : "Unauthorized" });
    return null;
  }
}

type CartInput = { productId: number; quantity: number };

async function validateCart(items: unknown) {
  if (!Array.isArray(items) || items.length === 0 || items.length > 50) {
    throw new Error("Your cart is empty.");
  }
  const normalized = new Map<number, number>();
  for (const value of items) {
    if (!value || typeof value !== "object") throw new Error("Invalid cart item.");
    const productId = Number((value as { productId?: unknown }).productId);
    const quantity = Number((value as { quantity?: unknown }).quantity);
    if (!Number.isInteger(productId) || productId <= 0 || !Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) {
      throw new Error("Each item must have a valid quantity.");
    }
    normalized.set(productId, (normalized.get(productId) ?? 0) + quantity);
  }
  const validated = [];
  for (const [productId, quantity] of normalized) {
    const [row] = await db.select({
      id: productsTable.id,
      sourceProductId: productsTable.sourceProductId,
      name: productsTable.productName,
      company: companiesTable.name,
      salePrice: sql<string | null>`min(${stockBatchesTable.salePrice})`,
      stock: sql<string | null>`coalesce(sum(${stockBatchesTable.quantity}), 0)`,
      prescriptionRequired: sql<boolean>`coalesce(${productOverridesTable.prescriptionRequired}, false)`,
      active: productsTable.active,
    }).from(productsTable)
      .leftJoin(companiesTable, eq(productsTable.companyId, companiesTable.id))
      .leftJoin(productOverridesTable, eq(productOverridesTable.productId, productsTable.id))
      .leftJoin(stockBatchesTable, eq(stockBatchesTable.productId, productsTable.id))
      .where(eq(productsTable.id, productId))
      .groupBy(productsTable.id, companiesTable.name, productOverridesTable.prescriptionRequired);
    if (!row || !row.active) throw new Error("One of the products is no longer available.");
    const stock = Number(row.stock ?? 0);
    if (stock < quantity) throw new Error(`${row.name} has only ${Math.max(0, stock)} available.`);
    if (!row.salePrice || Number(row.salePrice) < 0) throw new Error(`${row.name} does not have a current price.`);
    validated.push({ ...row, quantity, unitPrice: Number(row.salePrice), lineTotal: Number(row.salePrice) * quantity });
  }
  return validated;
}

router.post("/customer/checkout/validate", async (req, res): Promise<void> => {
  const identity = await customerGuard(req, res);
  if (!identity) return;
  try {
    const items = await validateCart(req.body?.items);
    const requiresPrescription = items.some((item) => item.prescriptionRequired);
    const prescriptionPath = typeof req.body?.prescriptionPath === "string" ? req.body.prescriptionPath : "";
    if (requiresPrescription && !prescriptionPath) {
      res.status(422).json({ error: "A prescription is required for one or more items.", code: "PRESCRIPTION_REQUIRED", items, requiresPrescription });
      return;
    }
    if (prescriptionPath && !prescriptionPath.startsWith(`prescriptions/${identity.uid}/`)) {
      res.status(400).json({ error: "Invalid prescription reference." });
      return;
    }
    if (requiresPrescription && prescriptionPath) {
      const [upload] = await db.select().from(prescriptionUploadsTable)
        .where(eq(prescriptionUploadsTable.objectPath, prescriptionPath)).limit(1);
      if (!upload || upload.customerUid !== identity.uid || upload.status === "rejected") {
        res.status(422).json({ error: "The prescription upload is not available for checkout." });
        return;
      }
    }
    const name = typeof req.body?.customerName === "string" ? req.body.customerName.trim() : "";
    const phone = typeof req.body?.phone === "string" ? req.body.phone.trim() : "";
    const address = typeof req.body?.address === "string" ? req.body.address.trim() : "";
    if (!name || !phone || !address) {
      res.status(400).json({ error: "Name, mobile number, and delivery address are required." });
      return;
    }
    const subtotal = items.reduce((total, item) => total + item.lineTotal, 0);
    res.json({
      customerUid: identity.uid,
      items,
      subtotal: subtotal.toFixed(2),
      requiresPrescription,
      prescriptionStatus: requiresPrescription ? "pending_review" : "not_required",
      message: "Checkout details validated. No payment or stock reservation has been made.",
    });
  } catch (error) {
    res.status(422).json({ error: error instanceof Error ? error.message : "Unable to validate checkout." });
  }
});

router.post("/customer/prescriptions/register", async (req, res): Promise<void> => {
  const identity = await customerGuard(req, res);
  if (!identity) return;
  const objectPath = typeof req.body?.objectPath === "string" ? req.body.objectPath : "";
  const contentType = typeof req.body?.contentType === "string" ? req.body.contentType : "";
  const size = Number(req.body?.size);
  if (!objectPath.startsWith(`prescriptions/${identity.uid}/`) || objectPath.includes("..")) {
    res.status(400).json({ error: "Invalid prescription reference." });
    return;
  }
  if (!ALLOWED_PRESCRIPTION_TYPES.has(contentType) || !Number.isInteger(size) || size <= 0 || size > MAX_PRESCRIPTION_BYTES) {
    res.status(400).json({ error: "Upload a PDF, JPG, or PNG prescription up to 10 MB." });
    return;
  }
  const [upload] = await db.insert(prescriptionUploadsTable).values({
    customerUid: identity.uid,
    objectPath,
    contentType,
    fileSize: size,
    status: "pending_review",
  }).onConflictDoUpdate({
    target: prescriptionUploadsTable.objectPath,
    set: { contentType, fileSize: size, status: "pending_review", updatedAt: new Date() },
  }).returning();
  res.status(201).json({ objectPath: upload.objectPath, prescriptionStatus: upload.status, message: "Prescription uploaded and queued for review." });
});

export default router;