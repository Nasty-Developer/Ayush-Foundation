import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit as firestoreLimit,
  serverTimestamp,
  updateDoc,
  type DocumentData,
} from 'firebase/firestore';
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from 'firebase/storage';

import { getFirestoreInstance } from '@/services/firestore';
import { getStorageInstance } from '@/services/storage';
import {
  ADMIN_COLLECTIONS,
  ADMIN_EMAIL,
  type AdminCollection,
  type AdminListOptions,
  type AdminRecord,
  type StoredImage,
} from './types';

export * from './types';

function normalizeValue(value: unknown): unknown {
  if (
    value &&
    typeof value === 'object' &&
    'toDate' in value &&
    typeof (value as { toDate?: unknown }).toDate === 'function'
  ) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }

  if (Array.isArray(value)) return value.map(normalizeValue);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, normalizeValue(entry)]),
    );
  }

  return value;
}

function assertCollection(collectionName: string): asserts collectionName is AdminCollection {
  if (!ADMIN_COLLECTIONS.includes(collectionName as AdminCollection)) {
    throw new Error('This admin collection is not available.');
  }
}

function toRecord(snapshot: { id: string; data: () => DocumentData }): AdminRecord {
  return {
    id: snapshot.id,
    ...(normalizeValue(snapshot.data()) as Record<string, unknown>),
  };
}

function matchesSearch(record: AdminRecord, search: string): boolean {
  const needle = search.trim().toLowerCase();
  if (!needle) return true;

  return Object.values(record).some((value) => {
    if (typeof value === 'string') return value.toLowerCase().includes(needle);
    return false;
  });
}

export async function listAdminRecords(
  collectionName: AdminCollection,
  options: AdminListOptions = {},
): Promise<AdminRecord[]> {
  assertCollection(collectionName);
  const recordsQuery = collection(getFirestoreInstance(), collectionName);
  const snapshot = options.limit
    ? await getDocs(recordsQuery).then((result) =>
        result.docs.slice(0, options.limit),
      )
    : (await getDocs(recordsQuery)).docs;

  return snapshot
    .map(toRecord)
    .filter((record) => {
      const statusMatches =
        !options.status ||
        options.status === 'all' ||
        record.status === options.status ||
        record.published === (options.status === 'published') ||
        record.active === (options.status === 'active');
      return statusMatches && matchesSearch(record, options.search ?? '');
    })
    .sort((left, right) => {
      const leftOrder = Number(left.displayOrder ?? left.order ?? 0);
      const rightOrder = Number(right.displayOrder ?? right.order ?? 0);
      if (leftOrder !== rightOrder) return leftOrder - rightOrder;

      const leftUpdated = String(left.updatedAt ?? left.createdAt ?? '');
      const rightUpdated = String(right.updatedAt ?? right.createdAt ?? '');
      return rightUpdated.localeCompare(leftUpdated);
    });
}

export async function countAdminRecords(
  collectionName: AdminCollection,
): Promise<number> {
  assertCollection(collectionName);
  const snapshot = await getDocs(collection(getFirestoreInstance(), collectionName));
  return snapshot.size;
}

export async function saveAdminRecord(
  collectionName: AdminCollection,
  data: Record<string, unknown>,
  id?: string,
): Promise<string> {
  assertCollection(collectionName);
  const cleanData = Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined),
  );

  if (id) {
    await updateDoc(doc(getFirestoreInstance(), collectionName, id), {
      ...cleanData,
      updatedAt: serverTimestamp(),
    });
    return id;
  }

  const created = await addDoc(collection(getFirestoreInstance(), collectionName), {
    ...cleanData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return created.id;
}

export async function deleteAdminRecord(
  collectionName: AdminCollection,
  id: string,
): Promise<void> {
  assertCollection(collectionName);
  await deleteDoc(doc(getFirestoreInstance(), collectionName, id));
}

export async function uploadAdminImage(
  file: File,
  folder: string,
  previous?: StoredImage,
): Promise<StoredImage> {
  const storage = getStorageInstance();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
  const storagePath = `admin/${folder}/${crypto.randomUUID()}-${safeName}`;
  const imageRef = ref(storage, storagePath);
  await uploadBytes(imageRef, file, { contentType: file.type || 'image/*' });
  const url = await getDownloadURL(imageRef);

  if (previous?.storagePath) {
    await deleteObject(ref(storage, previous.storagePath)).catch(() => undefined);
  }

  return { url, storagePath };
}

export async function removeAdminImage(image?: StoredImage): Promise<void> {
  if (!image?.storagePath) return;
  await deleteObject(ref(getStorageInstance(), image.storagePath)).catch(
    () => undefined,
  );
}

export function isAdminEmail(email: string | null | undefined): boolean {
  return email?.trim().toLowerCase() === ADMIN_EMAIL;
}