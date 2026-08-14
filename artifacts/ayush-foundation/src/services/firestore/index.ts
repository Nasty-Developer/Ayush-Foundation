import { firestore } from '@/lib/firebase';

export { firestore };

export function getFirestoreInstance() {
  if (!firestore) {
    throw new Error('Firestore is unavailable. Check Firebase configuration.');
  }

  return firestore;
}