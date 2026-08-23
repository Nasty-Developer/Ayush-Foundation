import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from 'firebase/storage';
import { requireFirebaseStorage, requireFirestore } from './firebase';

export type AdminRecord = {
  id: string;
  [key: string]: unknown;
};

export type AdminCollection =
  | 'medicines'
  | 'vetMedicines'
  | 'generalProducts'
  | 'categories'
  | 'brands'
  | 'banners'
  | 'newArrivals'
  | 'specialMedicines'
  | 'medicineRequests'
  | 'inquiries'
  | 'orders'
  | 'faqs'
  | 'testimonials'
  | 'announcements'
  | 'legal';

function normalizeRecord(id: string, data: Record<string, unknown>): AdminRecord {
  return { id, ...data };
}

export async function listRecords(
  collectionName: AdminCollection,
): Promise<AdminRecord[]> {
  const snapshot = await getDocs(collection(requireFirestore(), collectionName));
  return snapshot.docs
    .map((item) => normalizeRecord(item.id, item.data()))
    .sort((a, b) => {
      const aTime = getTimestamp(a.updatedAt ?? a.createdAt);
      const bTime = getTimestamp(b.updatedAt ?? b.createdAt);
      return bTime - aTime;
    });
}

export async function createRecord(
  collectionName: AdminCollection,
  data: Record<string, unknown>,
) {
  return addDoc(collection(requireFirestore(), collectionName), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateRecord(
  collectionName: AdminCollection,
  id: string,
  data: Record<string, unknown>,
) {
  return updateDoc(doc(requireFirestore(), collectionName, id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function removeRecord(collectionName: AdminCollection, id: string) {
  return deleteDoc(doc(requireFirestore(), collectionName, id));
}

export async function getRecord(
  collectionName: string,
  id: string,
): Promise<AdminRecord | null> {
  const snapshot = await getDoc(doc(requireFirestore(), collectionName, id));
  return snapshot.exists() ? normalizeRecord(snapshot.id, snapshot.data()) : null;
}

export async function saveSingleton(
  collectionName: string,
  id: string,
  data: Record<string, unknown>,
) {
  return setDoc(
    doc(requireFirestore(), collectionName, id),
    { ...data, updatedAt: serverTimestamp() },
    { merge: true },
  );
}

export async function uploadAdminImage(
  file: File,
  collectionName: string,
  recordId: string,
) {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
  const storageRef = ref(
    requireFirebaseStorage(),
    `admin/${collectionName}/${recordId}/${Date.now()}-${safeName}`,
  );
  const snapshot = await uploadBytes(storageRef, file, {
    contentType: file.type,
  });
  return getDownloadURL(snapshot.ref);
}

export async function deleteAdminImage(path: string) {
  return deleteObject(ref(requireFirebaseStorage(), path));
}

function getTimestamp(value: unknown): number {
  if (value && typeof value === 'object' && 'toMillis' in value) {
    return Number((value as { toMillis: () => number }).toMillis());
  }
  if (typeof value === 'number') return value;
  return 0;
}
