import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

function normalizePrivateKey(value: string): string {
  const trimmed = value.trim();
  const unquoted =
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
      ? trimmed.slice(1, -1)
      : trimmed;

  return unquoted.replace(/\\r?\\n/g, "\n").replace(/\r\n/g, "\n").trim();
}

function getAdminAuth() {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !privateKey) {
    return null;
  }
  const app = getApps()[0] ?? initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: normalizePrivateKey(privateKey),
    }),
  });
  return getAuth(app);
}

export async function requireAdminRequest(authorization: string | undefined): Promise<{ uid: string; email: string }> {
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : "";
  const auth = getAdminAuth();
  if (!auth) throw new Error("Backend Firebase verification is not configured. Add FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY.");
  if (!token) throw new Error("A Firebase ID token is required.");
  const decoded = await auth.verifyIdToken(token);
  if (decoded.email?.toLowerCase() !== "adminayushmedical@gmail.com") throw new Error("This Firebase account is not authorized.");
  return { uid: decoded.uid, email: decoded.email };
}