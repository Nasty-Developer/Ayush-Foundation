import { Router, type IRouter, type Request, type Response } from "express";
import { db, eq, customerProfilesTable } from "@workspace/db";
import { requireUserRequest } from "../lib/firebase-admin";

const router: IRouter = Router();

async function customerGuard(req: Request, res: Response) {
  try {
    return await requireUserRequest(req.header("authorization"));
  } catch (error) {
    res.status(error instanceof Error && error.message.includes("not configured") ? 503 : 401).json({
      error: error instanceof Error ? error.message : "Unauthorized",
    });
    return null;
  }
}

router.get("/customer/profile", async (req, res): Promise<void> => {
  const identity = await customerGuard(req, res);
  if (!identity) return;
  const [profile] = await db.select().from(customerProfilesTable).where(eq(customerProfilesTable.uid, identity.uid)).limit(1);
  res.json(profile ?? {
    uid: identity.uid,
    email: identity.email,
    displayName: identity.name,
    phone: null,
  });
});

router.put("/customer/profile", async (req, res): Promise<void> => {
  const identity = await customerGuard(req, res);
  if (!identity) return;
  const displayName = typeof req.body?.displayName === "string" ? req.body.displayName.trim() : null;
  const phone = typeof req.body?.phone === "string" ? req.body.phone.trim() : null;
  if (!displayName) {
    res.status(400).json({ error: "Your name is required." });
    return;
  }
  const [profile] = await db.insert(customerProfilesTable).values({
    uid: identity.uid,
    email: identity.email,
    displayName,
    phone: phone || null,
  }).onConflictDoUpdate({
    target: customerProfilesTable.uid,
    set: { email: identity.email, displayName, phone: phone || null, updatedAt: new Date() },
  }).returning();
  res.json(profile);
});

export default router;