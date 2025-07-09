import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth, signInAnonymously } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

export const isFirebaseConfigured = Object.values(firebaseConfig).every(
  value => value && !String(value).startsWith('your_')
);

let app: ReturnType<typeof initializeApp> | undefined;
let db: ReturnType<typeof getFirestore> | undefined;
let storage: ReturnType<typeof getStorage> | undefined;
let auth: ReturnType<typeof getAuth> | undefined;
let authReady: Promise<unknown> | undefined;

if (isFirebaseConfigured) {
  // Initialize Firebase
  app = initializeApp(firebaseConfig);

  // Initialize Firestore
  db = getFirestore(app);

  // Initialize Storage
  storage = getStorage(app);
  auth = getAuth(app);

  // Sign in anonymously and expose promise to await authentication
  authReady = signInAnonymously(auth).catch(error => {
    console.error('Anonymous sign-in failed:', error);
  });
} else {
  console.warn('Firebase not configured. Running in offline mode.');
}

export { app, db, storage, auth, authReady, isFirebaseConfigured };

export default app;
