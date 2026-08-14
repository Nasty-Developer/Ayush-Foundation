import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';

import { firebaseAuth } from '@/lib/firebase';
import { ADMIN_EMAIL, isAdminEmail } from './index';

export function isAdminUser(user: User | null): boolean {
  return Boolean(user?.email && isAdminEmail(user.email));
}

export async function signInAdmin(email: string, password: string): Promise<User> {
  if (!firebaseAuth) {
    throw new Error('Unable to connect to the authentication service. Please try again.');
  }

  try {
    const credential = await signInWithEmailAndPassword(
      firebaseAuth,
      email.trim().toLowerCase(),
      password,
    );

    if (!isAdminUser(credential.user)) {
      await signOut(firebaseAuth);
      throw new Error(
        'You are not authorized to access the Ayush Medico Admin Panel.',
      );
    }

    // Authorization is based on the authenticated Firebase user's email.
    // Do not reject the authorized admin solely because emailVerified is false:
    // that produced a misleading verification error after successful sign-in.
    return credential.user;
  } catch (error) {
    if (
      error instanceof Error &&
      error.message ===
        'You are not authorized to access the Ayush Medico Admin Panel.'
    ) {
      throw error;
    }

    const code =
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      typeof error.code === 'string'
        ? error.code
        : '';

    if (
      code === 'auth/invalid-credential' ||
      code === 'auth/invalid-email' ||
      code === 'auth/user-disabled' ||
      code === 'auth/user-not-found' ||
      code === 'auth/wrong-password'
    ) {
      throw new Error('Incorrect email or password.');
    }

    throw new Error(
      'Unable to connect to the authentication service. Please try again.',
    );
  }
}

export async function signOutAdmin(): Promise<void> {
  if (!firebaseAuth) return;
  await signOut(firebaseAuth);
}

export function subscribeToAdmin(
  onChange: (user: User | null) => void,
  onError: (error: Error) => void,
): () => void {
  const auth = firebaseAuth;
  if (!auth) {
    onChange(null);
    onError(new Error('Firebase Authentication is not configured yet.'));
    return () => undefined;
  }

  return onAuthStateChanged(
    auth,
    (user) => {
      if (isAdminUser(user)) {
        onChange(user);
        return;
      }

      onChange(null);
      if (user) {
        void signOut(auth).catch(onError);
      }
    },
    onError,
  );
}