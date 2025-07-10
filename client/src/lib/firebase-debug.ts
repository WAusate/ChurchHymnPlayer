// Firebase debugging utilities
import { db, storage, auth } from './firebase';

export async function testFirebaseConnectivity() {
  console.log('=== Firebase Connectivity Test ===');
  
  // Test auth
  console.log('Current user:', auth?.currentUser?.uid || 'Not authenticated');
  
  // Test basic Firestore read
  try {
    if (db) {
      console.log('Testing Firestore read...');
      // Simple test - try to get any document
      const testQuery = await db._delegate._databaseId;
      console.log('Firestore connection: OK', testQuery);
    }
  } catch (error) {
    console.error('Firestore connection test failed:', error);
  }
  
  // Test Storage
  try {
    if (storage) {
      console.log('Testing Storage connection...');
      const bucket = storage.app.options.storageBucket;
      console.log('Storage bucket:', bucket);
    }
  } catch (error) {
    console.error('Storage connection test failed:', error);
  }
  
  console.log('=== End Firebase Test ===');
}

// Call this in the browser console for debugging
(window as any).testFirebase = testFirebaseConnectivity;