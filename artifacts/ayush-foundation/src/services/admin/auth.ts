import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';

import { firebaseAuth } from '@/lib/firebase';
import { ADMIN_EMAIL, isAdminEmail } from './index';

export function isAdminUser(user: User | null): boolean {
  return Boolean(user && isAdminEmail(user.email));
}

export async function signInAdmin(email: string, password: string): Promise<User> {
  if (!firebaseAuth) {
    throw new Error('Firebase Authentication is not configured yet.');
  }

  if (!isAdminEmail(email)) {
    throw new Error(`Only the ${ADMIN_EMAIL} administrator account can sign in here.`);
  }

  const credential = await signInWithEmailAndPassword(firebaseAuth, email, password);
  if (!isAdminUser(credential.user)) {
    await signOut(firebaseAuth);
    throw new Error('This account is not authorized for the Ayush Medico admin panel.');
  }
  if (!credential.user.emailVerified) {
    await signOut(firebaseAuth);
    throw new Error('Verify the administrator email before accessing the admin panel.');
  }

  return credential.user;
}

export async function signOutAdmin(): Promise<void> {
  if (!firebaseAuth) return;
  await signOut(firebaseAuth);
}

export function subscribeToAdmin(
  onChange: (user: User | null) => void,
  onError: (error: Error) => void,
): () => void {
  if (!firebaseAuth) {
    onChange(null);
    onError(new Error('Firebase Authentication is not configured yet.'));
    return () => undefined;
  }

  return onAuthStateChanged(
    firebaseAuth,
    (user) => onChange(isAdminUser(user) ? user : null),
    onError,
  );
}