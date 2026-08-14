import { onAuthStateChanged, type User } from 'firebase/auth';
import { useEffect, useState } from 'react';

import {
  firebaseAuth,
  getFirebaseServiceError,
  getFirebaseStatus,
} from '@/lib/firebase';

export type FirebaseAuthState = {
  user: User | null;
  loading: boolean;
  available: boolean;
  error: Error | null;
};

export function subscribeToFirebaseAuth(
  onUserChange: (user: User | null) => void,
  onError?: (error: Error) => void,
): () => void {
  if (!firebaseAuth) {
    onUserChange(null);
    onError?.(
      getFirebaseServiceError('auth') ??
        new Error(getFirebaseStatus().initializationError ?? 'Firebase Auth is unavailable'),
    );
    return () => undefined;
  }

  return onAuthStateChanged(
    firebaseAuth,
    onUserChange,
    (error) => onError?.(error),
  );
}

export function useFirebaseAuth(): FirebaseAuthState {
  const [state, setState] = useState<FirebaseAuthState>({
    user: null,
    loading: true,
    available: firebaseAuth !== null,
    error: null,
  });

  useEffect(() => {
    const unsubscribe = subscribeToFirebaseAuth(
      (user) => {
        setState({
          user,
          loading: false,
          available: true,
          error: null,
        });
      },
      (error) => {
        setState({
          user: null,
          loading: false,
          available: firebaseAuth !== null,
          error,
        });
      },
    );

    return unsubscribe;
  }, []);

  return state;
}