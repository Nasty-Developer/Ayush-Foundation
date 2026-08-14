import { getFirebaseStatus, type FirebaseConnectionStatus } from '@/lib/firebase';

export function checkFirebaseConnection(): FirebaseConnectionStatus {
  const status = getFirebaseStatus();

  if (import.meta.env.DEV) {
    const summary = {
      configured: status.configured,
      projectId: status.projectId,
      app: status.app.available,
      auth: status.auth.available,
      firestore: status.firestore.available,
      storage: status.storage.available,
    };

    if (
      summary.configured &&
      summary.app &&
      summary.auth &&
      summary.firestore &&
      summary.storage
    ) {
      console.info('[Ayush Medico] Firebase foundation initialized', summary);
    } else {
      console.warn('[Ayush Medico] Firebase foundation is incomplete', {
        ...summary,
        errors: {
          app: status.app.error,
          auth: status.auth.error,
          firestore: status.firestore.error,
          storage: status.storage.error,
        },
      });
    }
  }

  return status;
}