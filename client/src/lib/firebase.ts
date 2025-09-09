import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Debug Firebase config
console.log('Firebase config status:', {
  hasApiKey: !!import.meta.env.VITE_FIREBASE_API_KEY,
  hasProjectId: !!import.meta.env.VITE_FIREBASE_PROJECT_ID,
  hasAppId: !!import.meta.env.VITE_FIREBASE_APP_ID,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  authDomain: firebaseConfig.authDomain,
  storageBucket: firebaseConfig.storageBucket
});

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

  // Initialize Firestore with better error handling
  db = getFirestore(app);
  
  // Enable network persistence for better offline support
  try {
    // Only enable persistence in production builds
    if (import.meta.env.PROD) {
      // We'll handle offline mode through localStorage instead
      console.log('Production mode: Using Firebase online mode');
    }
  } catch (err) {
    console.warn('Could not enable Firestore persistence:', err);
  }

  // Initialize Storage
  storage = getStorage(app);
  auth = getAuth(app);

  // Initialize auth without anonymous sign-in for email/password authentication
  authReady = Promise.resolve().then(() => {
    console.log('Firebase authentication initialized');
  });
} else {
  console.warn('Firebase not configured. Running in offline mode.');
}

export { app, db, storage, auth, authReady };

export default app;
