import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

function getAdminAuth() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    return null;
  }

  const app = getApps()[0] ?? initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
  return getAuth(app);
}

export async function requireAdminRequest(authorization: string | undefined): Promise<{ uid: string; email: string }> {
  const identity = await requireUserRequest(authorization);
  if (identity.email?.toLowerCase() !== "adminayushmedical@gmail.com") throw new Error("This Firebase account is not authorized.");
  return { uid: identity.uid, email: identity.email };
}

export async function requireUserRequest(authorization: string | undefined): Promise<{ uid: string; email: string; name: string | null }> {
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : "";
  const auth = getAdminAuth();
  if (!auth) throw new Error("Backend Firebase verification is not configured. Add FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY.");
  if (!token) throw new Error("A Firebase ID token is required.");
  const decoded = await auth.verifyIdToken(token);
  if (!decoded.email) throw new Error("A verified Firebase email is required.");
  return { uid: decoded.uid, email: decoded.email, name: decoded.name ?? null };
}