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
  try {
    console.log('Starting upload for file:', file.name, 'size:', file.size, 'type:', file.type);
    console.log('Upload path:', path);
    
    if (!file) {
      throw new Error('No file provided for upload');
    }
    
    if (!file.type.startsWith('audio/')) {
      throw new Error('File must be an audio file');
    }
    
    const token = await getAuthToken();
    console.log('Got auth token, proceeding with upload...');
    
    // Clean and format the storage bucket name
    console.log('Original STORAGE_BUCKET:', STORAGE_BUCKET);
    
    if (!STORAGE_BUCKET) {
      throw new Error('STORAGE_BUCKET environment variable is not set');
    }
    
    // Use the full storage bucket URL for newer Firebase Storage format
    const cleanPath = path.startsWith('hinos/') ? path : `hinos/${path}`;
    
    // Use the correct Firebase Storage URL format
    const uploadUrl = `https://firebasestorage.googleapis.com/v0/b/${STORAGE_BUCKET}/o?name=${encodeURIComponent(cleanPath)}`;
    console.log('Upload URL:', uploadUrl);
    console.log('Clean path:', cleanPath);
    console.log('Storage bucket:', STORAGE_BUCKET);
    
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = (e.loaded / e.total) * 100;
          console.log(`Upload progress: ${progress.toFixed(1)}%`);
          progressCallback?.(progress);
        }
      });
      
      xhr.addEventListener('load', () => {
        console.log('Upload completed with status:', xhr.status);
        console.log('Upload response:', xhr.responseText);
        
        try {
          if (xhr.status === 200) {
            const response = JSON.parse(xhr.responseText);
            console.log('Upload successful, response:', response);
            resolve(response.name || cleanPath);
          } else {
            const errorText = xhr.responseText || xhr.statusText;
            console.error('Upload error response:', errorText);
            console.error('Upload error status:', xhr.status);
            reject(new Error(`Upload failed: ${xhr.status} ${errorText}`));
          }
        } catch (parseError) {
          console.error('Error parsing upload response:', parseError);
          console.error('Raw response text:', xhr.responseText);
          reject(new Error('Invalid response from upload server'));
        }
      });
      
      xhr.addEventListener('error', (e) => {
        console.error('Upload network error:', e);
        console.error('XHR error details:', xhr.status, xhr.statusText);
        reject(new Error(`Upload failed due to network error: ${xhr.status} ${xhr.statusText}`));
      });
      
      xhr.addEventListener('timeout', () => {
        console.error('Upload timeout');
        reject(new Error('Upload timeout'));
      });
      
      xhr.open('POST', uploadUrl);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.timeout = 60000; // 60 second timeout
      
      console.log('Sending file via XHR...');
      xhr.send(file);
    });
  } catch (error) {
    console.error('Error in uploadFileToStorage:', error);
    console.error('Error details:', error.message, error.stack);
    throw new Error(`Upload setup failed: ${error.message || 'Unknown error'}`);
  }
}

// Get download URL for uploaded file
export async function getDownloadUrl(storagePath: string): Promise<string> {
  try {
    // Ensure proper path format
    const cleanPath = storagePath.startsWith('hinos/') ? storagePath : `hinos/${storagePath}`;
    
    // First, try to get the file metadata and download token via Firebase REST API
    try {
      const token = await getAuthToken();
      const metadataUrl = `https://firebasestorage.googleapis.com/v0/b/${STORAGE_BUCKET}/o/${encodeURIComponent(cleanPath)}`;
      
      console.log('Getting file metadata from:', metadataUrl);
      
      const response = await fetch(metadataUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const metadata = await response.json();
        console.log('File metadata:', metadata);
        
        // If file has a download token, use it
        if (metadata.downloadTokens) {
          const authenticatedUrl = `https://firebasestorage.googleapis.com/v0/b/${STORAGE_BUCKET}/o/${encodeURIComponent(cleanPath)}?alt=media&token=${metadata.downloadTokens}`;
          console.log('Using authenticated URL:', authenticatedUrl);
          return authenticatedUrl;
        }
      }
    } catch (metadataError) {
      console.log('Metadata fetch failed, trying direct URL:', metadataError);
    }
    
    // Fallback: try direct public URL
    const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${STORAGE_BUCKET}/o/${encodeURIComponent(cleanPath)}?alt=media`;
    console.log('Trying public URL:', publicUrl);
    
    // Test if the URL is accessible
    const testResponse = await fetch(publicUrl, { method: 'HEAD' });
    
    if (testResponse.ok) {
      console.log('Public URL works:', publicUrl);
      return publicUrl;
    } else {
      console.log('Public URL failed, status:', testResponse.status);
      // If public access fails, try with auth token
      const token = await getAuthToken();
      const authUrl = `https://firebasestorage.googleapis.com/v0/b/${STORAGE_BUCKET}/o/${encodeURIComponent(cleanPath)}?alt=media&token=${token}`;
      console.log('Using auth URL:', authUrl);
      return authUrl;
    }
  } catch (error) {
    console.error('Error getting download URL:', error);
    // Fallback to direct URL construction
    const cleanPath = storagePath.startsWith('hinos/') ? storagePath : `hinos/${storagePath}`;
    const fallbackUrl = `https://firebasestorage.googleapis.com/v0/b/${STORAGE_BUCKET}/o/${encodeURIComponent(cleanPath)}?alt=media`;
    console.log('Using fallback URL:', fallbackUrl);
    return fallbackUrl;
  }
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
      audioPath: doc.fields.audioPath.stringValue.trim(), // Clean any whitespace/newlines
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