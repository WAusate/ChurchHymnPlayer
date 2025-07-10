// Firebase REST API implementation to bypass WebChannel transport issues
import { auth } from './firebase';

export interface RestHymn {
  numero: number;
  titulo: string;
  orgao: string;
  audioPath: string;
  criadoEm: string; // ISO string
}

const PROJECT_ID = import.meta.env.VITE_FIREBASE_PROJECT_ID;
const STORAGE_BUCKET = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET;

// Get auth token for authenticated requests
async function getAuthToken(): Promise<string> {
  if (!auth?.currentUser) {
    throw new Error('User not authenticated');
  }
  try {
    const token = await auth.currentUser.getIdToken(true); // Force refresh
    console.log('Auth token obtained successfully');
    return token;
  } catch (error) {
    console.error('Failed to get auth token:', error);
    throw new Error('Failed to get authentication token');
  }
}

// Upload file to Firebase Storage using REST API
export async function uploadFileToStorage(
  file: File,
  path: string,
  progressCallback?: (progress: number) => void
): Promise<string> {
  const token = await getAuthToken();
  
  const uploadUrl = `https://firebasestorage.googleapis.com/v0/b/${STORAGE_BUCKET}/o?name=${encodeURIComponent(path)}`;
  
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const progress = (e.loaded / e.total) * 100;
        progressCallback?.(progress);
      }
    });
    
    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        const response = JSON.parse(xhr.responseText);
        resolve(response.name);
      } else {
        reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
      }
    });
    
    xhr.addEventListener('error', () => {
      reject(new Error('Upload failed due to network error'));
    });
    
    xhr.open('POST', uploadUrl);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.send(file);
  });
}

// Get download URL for uploaded file
export async function getDownloadUrl(storagePath: string): Promise<string> {
  const token = await getAuthToken();
  
  const url = `https://firebasestorage.googleapis.com/v0/b/${STORAGE_BUCKET}/o/${encodeURIComponent(storagePath)}?alt=media`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to get download URL: ${response.status}`);
  }
  
  return url;
}

// Add document to Firestore using REST API
export async function addDocumentToFirestore(
  collection: string,
  data: any
): Promise<string> {
  try {
    const token = await getAuthToken();
    console.log('Adding document to collection:', collection, 'Data:', data);
    
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${collection}`;
    
    // Convert data to Firestore format
    const firestoreData = {
      fields: {
        numero: { integerValue: data.numero.toString() },
        titulo: { stringValue: data.titulo },
        orgao: { stringValue: data.orgao },
        audioPath: { stringValue: data.audioPath },
        criadoEm: { timestampValue: new Date().toISOString() }
      }
    };
    
    console.log('Firestore payload:', JSON.stringify(firestoreData, null, 2));
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(firestoreData)
    });
    
    const responseText = await response.text();
    console.log('Firestore response status:', response.status);
    console.log('Firestore response text:', responseText);
    
    if (!response.ok) {
      throw new Error(`Firestore write failed: ${response.status} - ${responseText}`);
    }
    
    const result = JSON.parse(responseText);
    return result.name.split('/').pop(); // Extract document ID
  } catch (error) {
    console.error('Error in addDocumentToFirestore:', error);
    throw error;
  }
}

// Get documents from Firestore using REST API
export async function getDocumentsFromFirestore(
  collection: string,
  orderBy?: string,
  where?: { field: string; op: string; value: any }
): Promise<any[]> {
  try {
    const token = await getAuthToken();
    console.log('Getting documents from collection:', collection);
    
    let url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${collection}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Firestore read error:', response.status, errorText);
      throw new Error(`Firestore read failed: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    console.log('Firestore response:', result);
    
    if (!result.documents) {
      return [];
    }
    
    // Convert Firestore format to regular objects
    return result.documents.map((doc: any) => ({
      id: doc.name.split('/').pop(),
      numero: parseInt(doc.fields.numero.integerValue),
      titulo: doc.fields.titulo.stringValue,
      orgao: doc.fields.orgao.stringValue,
      audioPath: doc.fields.audioPath.stringValue,
      criadoEm: new Date(doc.fields.criadoEm.timestampValue)
    }));
  } catch (error) {
    console.error('Error in getDocumentsFromFirestore:', error);
    throw error;
  }
}

// Get next hymn number for specific organ
export async function getNextHymnNumber(orgao: string): Promise<number> {
  try {
    console.log('Getting next hymn number for organ:', orgao);
    const hymns = await getDocumentsFromFirestore('hinos');
    console.log('Total hymns found:', hymns.length);
    
    const organHymns = hymns.filter(h => h.orgao === orgao);
    console.log('Hymns for organ', orgao, ':', organHymns.length);
    
    if (organHymns.length === 0) {
      console.log('No hymns found for organ, starting with 1');
      return 1;
    }
    
    const maxNumber = Math.max(...organHymns.map(h => h.numero));
    const nextNumber = maxNumber + 1;
    console.log('Next hymn number will be:', nextNumber);
    return nextNumber;
  } catch (error) {
    console.error('Error getting hymn number:', error);
    console.warn('Using random number as fallback');
    return Math.floor(Math.random() * 9000) + 1000;
  }
}