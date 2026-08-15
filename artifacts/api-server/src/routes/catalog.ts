import crypto from "node:crypto";
import { Router, type IRouter, type Request, type Response } from "express";
import { and, asc, count, desc, eq, ilike, or, sql, db, categoriesTable, companiesTable, drugsTable, importErrorsTable, importFilesTable, importJobsTable, productOverridesTable, productsTable, stockBatchesTable } from "@workspace/db";
import { requireAdminRequest } from "../lib/firebase-admin";
import { previewImportFile, syncImportJob } from "../lib/catalog-sync";
import { detectType, mappingFor } from "../lib/sdf";

const router: IRouter = Router();
const MAX_UPLOAD_BYTES = 60 * 1024 * 1024;

function getQueryString(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

async function adminGuard(req: Request, res: Response) {
  try {
    return await requireAdminRequest(req.header("authorization"));
  } catch (error) {
    res.status(error instanceof Error && error.message.includes("not configured") ? 503 : 401).json({ error: error instanceof Error ? error.message : "Unauthorized" });
    return null;
  }
}

router.get("/catalog/categories", async (_req, res): Promise<void> => {
  const rows = await db.select({ id: categoriesTable.id, name: categoriesTable.name, displayName: categoriesTable.displayName, active: categoriesTable.active }).from(categoriesTable).where(eq(categoriesTable.active, true)).orderBy(asc(categoriesTable.name));
  res.json(rows);
});

router.get("/catalog/autocomplete", async (req, res): Promise<void> => {
  const query = getQueryString(req.query.q);
  if (query.length < 2) { res.json([]); return; }
  const term = `%${query}%`;
  const rows = await db.select({ id: productsTable.id, name: productsTable.productName, sourceProductId: productsTable.sourceProductId, company: companiesTable.name, drug: drugsTable.drugName }).from(productsTable).leftJoin(companiesTable, eq(productsTable.companyId, companiesTable.id)).leftJoin(drugsTable, eq(productsTable.drugId, drugsTable.id)).where(and(eq(productsTable.active, true), or(ilike(productsTable.productName, term), ilike(companiesTable.name, term), ilike(drugsTable.drugName, term)))).orderBy(asc(productsTable.productName)).limit(8);
  res.json(rows);
});

router.get("/catalog/products", async (req, res): Promise<void> => {
  const q = getQueryString(req.query.q);
  const category = getQueryString(req.query.category);
  const audience = getQueryString(req.query.audience);
  const page = Math.max(1, Number.parseInt(getQueryString(req.query.page, "1"), 10) || 1);
  const pageSize = Math.min(48, Math.max(1, Number.parseInt(getQueryString(req.query.pageSize, "12"), 10) || 12));
  const conditions = [eq(productsTable.active, true)];
  if (q) {
    const term = `%${q}%`;
    conditions.push(or(ilike(productsTable.productName, term), ilike(productsTable.sourceProductId, term), ilike(companiesTable.name, term), ilike(drugsTable.drugName, term), ilike(categoriesTable.name, term))!);
  }
  if (category) conditions.push(eq(categoriesTable.normalizedName, category.toLocaleLowerCase()));
  if (audience === "veterinary") conditions.push(ilike(categoriesTable.name, "%vet%"));
  if (audience === "general") conditions.push(sql`lower(${categoriesTable.name}) not like '%vet%'`);
  const rows = await db.select({
    id: productsTable.id,
    sourceProductId: productsTable.sourceProductId,
    name: productsTable.productName,
    company: companiesTable.name,
    drug: drugsTable.drugName,
    category: categoriesTable.name,
    categoryDisplayName: categoriesTable.displayName,
    dosageForm: productsTable.dosageForm,
    packSize: productsTable.packSize,
    imageUrl: sql<string | null>`coalesce(${productOverridesTable.imageUrl}, ${productsTable.imageUrl})`,
    salePrice: sql<string | null>`min(${stockBatchesTable.salePrice})`,
    mrp: sql<string | null>`min(${stockBatchesTable.mrp})`,
    quantity: sql<string | null>`coalesce(sum(${stockBatchesTable.quantity}), 0)`,
  }).from(productsTable).leftJoin(companiesTable, eq(productsTable.companyId, companiesTable.id)).leftJoin(drugsTable, eq(productsTable.drugId, drugsTable.id)).leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id)).leftJoin(productOverridesTable, eq(productOverridesTable.productId, productsTable.id)).leftJoin(stockBatchesTable, eq(stockBatchesTable.productId, productsTable.id)).where(and(...conditions)).groupBy(productsTable.id, companiesTable.name, drugsTable.drugName, categoriesTable.name, categoriesTable.displayName, productOverridesTable.imageUrl).orderBy(asc(productsTable.productName)).limit(pageSize).offset((page - 1) * pageSize);
  const [{ total }] = await db.select({ total: count() }).from(productsTable).leftJoin(companiesTable, eq(productsTable.companyId, companiesTable.id)).leftJoin(drugsTable, eq(productsTable.drugId, drugsTable.id)).leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id)).where(and(...conditions));
  res.json({ items: rows, page, pageSize, total: Number(total), totalPages: Math.ceil(Number(total) / pageSize) });
});

router.get("/catalog/stats", async (_req, res): Promise<void> => {
  const [products, categories, companies, drugs, stock, veterinary] = await Promise.all([
    db.select({ value: count() }).from(productsTable).where(eq(productsTable.active, true)),
    db.select({ value: count() }).from(categoriesTable).where(eq(categoriesTable.active, true)),
    db.select({ value: count() }).from(companiesTable),
    db.select({ value: count() }).from(drugsTable),
    db.select({ value: count() }).from(stockBatchesTable),
    db.select({ value: count() }).from(productsTable).leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id)).where(and(eq(productsTable.active, true), ilike(categoriesTable.name, "%vet%"))),
  ]);
  res.json({ products: Number(products[0]?.value ?? 0), categories: Number(categories[0]?.value ?? 0), companies: Number(companies[0]?.value ?? 0), drugs: Number(drugs[0]?.value ?? 0), stockRecords: Number(stock[0]?.value ?? 0), veterinaryProducts: Number(veterinary[0]?.value ?? 0), generalProducts: Number(products[0]?.value ?? 0) - Number(veterinary[0]?.value ?? 0) });
});

router.get("/catalog/imports", async (req, res): Promise<void> => {
  if (!await adminGuard(req, res)) return;
  const jobs = await db.select().from(importJobsTable).orderBy(desc(importJobsTable.createdAt)).limit(20);
  const files = await db.select({ id: importFilesTable.id, jobId: importFilesTable.jobId, fileType: importFilesTable.fileType, fileName: importFilesTable.fileName, fileSize: importFilesTable.fileSize, recordCount: importFilesTable.recordCount, mappingStatus: importFilesTable.mappingStatus, createdAt: importFilesTable.createdAt }).from(importFilesTable).orderBy(desc(importFilesTable.createdAt)).limit(100);
  res.json({ jobs, files });
});

router.get("/catalog/imports/:id", async (req, res): Promise<void> => {
  if (!await adminGuard(req, res)) return;
  const id = Number.parseInt(String(req.params.id), 10);
  const [job] = await db.select().from(importJobsTable).where(eq(importJobsTable.id, id)).limit(1);
  if (!job) { res.status(404).json({ error: "Import job not found." }); return; }
  const files = await db.select({ id: importFilesTable.id, jobId: importFilesTable.jobId, fileType: importFilesTable.fileType, fileName: importFilesTable.fileName, fileSize: importFilesTable.fileSize, recordCount: importFilesTable.recordCount, mappingStatus: importFilesTable.mappingStatus, mapping: importFilesTable.mapping, preview: importFilesTable.preview, createdAt: importFilesTable.createdAt }).from(importFilesTable).where(eq(importFilesTable.jobId, id));
  const errors = await db.select().from(importErrorsTable).where(eq(importErrorsTable.jobId, id)).orderBy(asc(importErrorsTable.recordNumber)).limit(200);
  res.json({ job, files, errors });
});

router.post("/catalog/imports/upload", async (req, res): Promise<void> => {
  if (!await adminGuard(req, res)) return;
  const body = req.body as Buffer;
  const fileName = getQueryString(req.header("x-file-name"));
  if (!Buffer.isBuffer(body) || body.length === 0 || body.length > MAX_UPLOAD_BYTES) { res.status(400).json({ error: "Upload an SDF file up to 60 MB." }); return; }
  let fileType: ReturnType<typeof detectType>;
  try { fileType = detectType(fileName); } catch (error) { res.status(400).json({ error: error instanceof Error ? error.message : "Unsupported SDF filename." }); return; }
  const parsed = await previewImportFile(fileName, body.toString("utf8"));
  const [job] = await db.insert(importJobsTable).values({ status: "uploaded", recordsDetected: parsed.records.length, errorCount: parsed.errors.length }).returning();
  await db.insert(importFilesTable).values({ jobId: job.id, fileType, fileName, fileSize: body.length, contentHash: parsed.hash, sourceText: body.toString("utf8"), detectedDelimiter: parsed.delimiter, recordCount: parsed.records.length, mappingStatus: parsed.mappingStatus, mapping: parsed.mapping, preview: parsed.fields.length ? parsed.records.slice(0, 10).map((row) => Object.fromEntries(parsed.fields.map((field) => [field.name, row.values[field.index] ?? ""]))) : [] });
  if (parsed.errors.length) await db.insert(importErrorsTable).values(parsed.errors.map((item) => ({ jobId: job.id, fileId: null, recordNumber: item.recordNumber, reason: item.reason, sourceIdentifier: null, sourceExcerpt: item.excerpt })));
  res.status(201).json({ jobId: job.id, fileName, fileType, fileSize: body.length, recordCount: parsed.records.length, mappingStatus: parsed.mappingStatus, delimiter: parsed.delimiter, fields: parsed.fields, errors: parsed.errors, mappings: mappingFor(fileType) });
});

router.post("/catalog/imports/:id/sync", async (req, res): Promise<void> => {
  if (!await adminGuard(req, res)) return;
  const id = Number.parseInt(String(req.params.id), 10);
  try {
    const summary = await syncImportJob(id);
    res.json({ jobId: id, status: "completed", ...summary });
  } catch (error) {
    await db.update(importJobsTable).set({ status: "failed", completedAt: new Date(), summary: { error: error instanceof Error ? error.message : "Import failed" } }).where(eq(importJobsTable.id, id));
    res.status(422).json({ error: error instanceof Error ? error.message : "Import failed." });
  }
});

router.post("/catalog/products/:id/image-signature", async (req, res): Promise<void> => {
  if (!await adminGuard(req, res)) return;
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !secret) { res.status(503).json({ error: "Cloudinary is not configured on the server." }); return; }
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = "ayush-medico/products";
  const publicId = `product-${String(req.params.id)}`;
  const signature = crypto.createHash("sha1").update(`folder=${folder}&public_id=${publicId}&timestamp=${timestamp}${secret}`).digest("hex");
  res.json({ cloudName, apiKey, timestamp, folder, publicId, signature });
});

router.patch("/catalog/products/:id/image", async (req, res): Promise<void> => {
  if (!await adminGuard(req, res)) return;
  const id = Number.parseInt(String(req.params.id), 10);
  const imageUrl = typeof req.body?.imageUrl === "string" ? req.body.imageUrl : null;
  const publicId = typeof req.body?.publicId === "string" ? req.body.publicId : null;
  if (!imageUrl || !publicId) { res.status(400).json({ error: "imageUrl and publicId are required." }); return; }
  const [saved] = await db.insert(productOverridesTable).values({ productId: id, imageUrl, cloudinaryPublicId: publicId }).onConflictDoUpdate({ target: productOverridesTable.productId, set: { imageUrl, cloudinaryPublicId: publicId, updatedAt: new Date() } }).returning();
  res.json(saved);
});

router.delete("/catalog/products/:id/image", async (req, res): Promise<void> => {
  if (!await adminGuard(req, res)) return;
  const id = Number.parseInt(String(req.params.id), 10);
  const [override] = await db.select().from(productOverridesTable).where(eq(productOverridesTable.productId, id)).limit(1);
  if (override?.cloudinaryPublicId && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET && process.env.CLOUDINARY_CLOUD_NAME) {
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = crypto.createHash("sha1").update(`public_id=${override.cloudinaryPublicId}&timestamp=${timestamp}${process.env.CLOUDINARY_API_SECRET}`).digest("hex");
    await fetch(`https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/destroy`, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ public_id: override.cloudinaryPublicId, timestamp: String(timestamp), api_key: process.env.CLOUDINARY_API_KEY, signature }) });
  }
  await db.delete(productOverridesTable).where(eq(productOverridesTable.productId, id));
  res.status(204).send();
});

export default router;