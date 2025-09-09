// Firebase debugging utilities
import { db, storage, auth } from './firebase';
import { getDocumentsFromFirestore, addDocumentToFirestore } from './firebase-rest';

export async function testFirebaseConnectivity() {
  console.log('=== Firebase Connectivity Test ===');
  
  // Test auth
  console.log('Current user:', auth?.currentUser?.uid || 'Not authenticated');
  
  if (auth?.currentUser) {
    try {
      const token = await auth.currentUser.getIdToken();
      console.log('Auth token length:', token.length);
      console.log('Token starts with:', token.substring(0, 20) + '...');
    } catch (error) {
      console.error('Failed to get auth token:', error);
    }
  }
  
  // Test REST API Firestore read
  try {
    console.log('Testing REST API Firestore read...');
    const hymns = await getDocumentsFromFirestore('hinos');
    console.log('REST API Firestore read successful, found hymns:', hymns.length);
  } catch (error) {
    console.error('REST API Firestore read failed:', error);
  }
  
  // Test environment variables
  console.log('Project ID:', import.meta.env.VITE_FIREBASE_PROJECT_ID);
  console.log('Storage Bucket:', import.meta.env.VITE_FIREBASE_STORAGE_BUCKET);
  
  console.log('=== End Firebase Test ===');
}

export async function testFirestoreWrite() {
  console.log('=== Testing Firestore Write ===');
  
  try {
    const testData = {
      numero: 9999,
      titulo: 'Test Hymn - Delete Me',
      orgao: 'Test',
      audioPath: 'test/path.mp3'
    };
    
    const docId = await addDocumentToFirestore('hinos', testData);
    console.log('Test document created with ID:', docId);
    return docId;
  } catch (error) {
    console.error('Test write failed:', error);
    throw error;
  }
}

// Call this in the browser console for debugging
(window as any).testFirebase = testFirebaseConnectivity;
(window as any).testFirestoreWrite = testFirestoreWrite;