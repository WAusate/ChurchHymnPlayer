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

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Storage
export const storage = getStorage(app);
export const auth = getAuth(app);
t57kza-codex/corrigir-erro-de-permissoes-ao-adicionar-hino
// Sign in anonymously and expose promise to await authentication
export const authReady = signInAnonymously(auth).catch((error) => {
// Attempt anonymous sign-in so Storage rules requiring authentication pass
signInAnonymously(auth).catch((error) => {
main
  console.error('Anonymous sign-in failed:', error);
});

export default app;
