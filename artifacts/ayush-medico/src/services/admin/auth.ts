import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
  type UserCredential,
} from 'firebase/auth';

import { firebaseAuth } from '@/lib/firebase';
import { isAdminEmail } from './index';

export function isAdminUser(user: User | null): boolean {
  return Boolean(user && isAdminEmail(user.email));
}

function getSignInError(error: unknown): Error {
  const code = typeof error === 'object' && error !== null && 'code' in error
    ? String((error as { code?: unknown }).code)
    : '';

  if (
    code === 'auth/invalid-credential' ||
    code === 'auth/invalid-email' ||
    code === 'auth/user-disabled' ||
    code === 'auth/user-not-found' ||
    code === 'auth/wrong-password'
  ) {
    return new Error('Incorrect email or password.');
  }

  return new Error(
    'Unable to connect to the authentication service. Please try again.',
  );
}

export async function signInAdmin(email: string, password: string): Promise<User> {
  if (!firebaseAuth) {
    throw new Error(
      'Unable to connect to the authentication service. Please try again.',
    );
  }

  let credential: UserCredential;
  try {
    credential = await signInWithEmailAndPassword(
      firebaseAuth,
      email.trim(),
      password,
    );
  } catch (error) {
    throw getSignInError(error);
  }

  if (!isAdminUser(credential.user)) {
    await signOut(firebaseAuth);
    throw new Error(
      'You are not authorized to access the Ayush Medico Admin Panel.',
    );
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
    onError(
      new Error(
        'Unable to connect to the authentication service. Please try again.',
      ),
    );
    return () => undefined;
  }

  const auth = firebaseAuth;

  return onAuthStateChanged(
    auth,
    (user) => {
      if (!user) {
        onChange(null);
        return;
      }

      if (isAdminUser(user)) {
        onChange(user);
        return;
      }

      void signOut(auth).finally(() => {
        onChange(null);
        onError(new Error('You are not authorized to access the Ayush Medico Admin Panel.'));
      });
    },
    onError,
  );
}