import { getApp, getApps, initializeApp, type FirebaseApp, type FirebaseOptions } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

type FirebaseServiceName = 'auth' | 'firestore' | 'storage';

export type FirebaseServiceStatus = {
  available: boolean;
  error?: string;
};

export type FirebaseConnectionStatus = {
  configured: boolean;
  projectId: string | null;
  app: FirebaseServiceStatus;
  auth: FirebaseServiceStatus;
  firestore: FirebaseServiceStatus;
  storage: FirebaseServiceStatus;
  initializationError?: string;
};

const firebaseConfig: FirebaseOptions = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const requiredConfigKeys = [
  'apiKey',
  'authDomain',
  'projectId',
  'storageBucket',
  'messagingSenderId',
  'appId',
] as const;

const missingConfigKeys = requiredConfigKeys.filter(
  (key) => !firebaseConfig[key],
);

const serviceErrors: Partial<Record<FirebaseServiceName, string>> = {};
let initializationError: string | undefined;
let firebaseApp: FirebaseApp | null = null;
let firebaseAuth: Auth | null = null;
let firestore: Firestore | null = null;
let firebaseStorage: FirebaseStorage | null = null;

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown Firebase error';
}

function initializeFirebase(): void {
  if (missingConfigKeys.length > 0) {
    initializationError = `Missing Firebase configuration: ${missingConfigKeys.join(', ')}`;
    return;
  }

  try {
    firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  } catch (error) {
    initializationError = getErrorMessage(error);
    return;
  }

  const serviceInitializers: Array<{
    name: FirebaseServiceName;
    initialize: () => void;
  }> = [
    {
      name: 'auth',
      initialize: () => {
        firebaseAuth = getAuth(firebaseApp!);
      },
    },
    {
      name: 'firestore',
      initialize: () => {
        firestore = getFirestore(firebaseApp!);
      },
    },
    {
      name: 'storage',
      initialize: () => {
        firebaseStorage = getStorage(firebaseApp!);
      },
    },
  ];

  for (const service of serviceInitializers) {
    try {
      service.initialize();
    } catch (error) {
      serviceErrors[service.name] = getErrorMessage(error);
    }
  }
}

initializeFirebase();

export { firebaseApp, firebaseAuth, firestore, firebaseStorage };

export function getFirebaseStatus(): FirebaseConnectionStatus {
  return {
    configured: missingConfigKeys.length === 0,
    projectId: firebaseConfig.projectId ?? null,
    app: {
      available: firebaseApp !== null,
      ...(initializationError ? { error: initializationError } : {}),
    },
    auth: {
      available: firebaseAuth !== null,
      ...(serviceErrors.auth ? { error: serviceErrors.auth } : {}),
    },
    firestore: {
      available: firestore !== null,
      ...(serviceErrors.firestore ? { error: serviceErrors.firestore } : {}),
    },
    storage: {
      available: firebaseStorage !== null,
      ...(serviceErrors.storage ? { error: serviceErrors.storage } : {}),
    },
    ...(initializationError ? { initializationError } : {}),
  };
}

export function getFirebaseServiceError(
  service: FirebaseServiceName,
): Error | null {
  const error = serviceErrors[service];
  return error ? new Error(error) : null;
}