import { firebaseStorage } from '@/lib/firebase';

export { firebaseStorage };

export function getStorageInstance() {
  if (!firebaseStorage) {
    throw new Error('Firebase Storage is unavailable. Check Firebase configuration.');
  }

  return firebaseStorage;
}