// Firebase Web SDK implementation for reading data (no authentication required)
import { db, storage, isFirebaseConfigured } from './firebase';
import { collection, getDocs, query, where, orderBy, addDoc, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export interface Hymn {
  numero: number;
  titulo: string;
  orgao: string;
  audioPath: string;
  audioUrl?: string;
  criadoEm: string;
}

// Get hymns by organ using Firebase Web SDK (no auth required for reads)
export async function getHymnsByOrganSDK(organName: string): Promise<Hymn[]> {
  if (!isFirebaseConfigured || !db) {
    console.warn('Firebase not configured, using offline mode');
    return [];
  }

  try {
    console.log('Getting hymns for organ using Firebase SDK:', organName);
    
    const hymnsRef = collection(db, 'hinos');
    const q = query(
      hymnsRef,
      where('orgao', '==', organName),
      orderBy('numero', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    console.log('Firebase SDK query completed, documents found:', querySnapshot.size);
    
    const hymns: Hymn[] = [];
    
    for (const doc of querySnapshot.docs) {
      const data = doc.data();
      console.log('Processing hymn:', data);
      
      // Get download URL for the audio file
      let audioUrl = '';
      if (data.audioPath && storage) {
        try {
          const audioRef = ref(storage, data.audioPath);
          audioUrl = await getDownloadURL(audioRef);
          console.log('Got download URL:', audioUrl);
        } catch (error) {
          console.error('Error getting download URL for', data.audioPath, error);
          // Continue without audio URL
        }
      }
      
      const hymn: Hymn = {
        numero: data.numero || 0,
        titulo: data.titulo || '',
        orgao: data.orgao || '',
        audioPath: data.audioPath || '',
        audioUrl,
        criadoEm: data.criadoEm?.toDate?.()?.toISOString() || data.criadoEm || new Date().toISOString()
      };
      
      hymns.push(hymn);
    }
    
    console.log('Final hymns processed via SDK:', hymns.length);
    return hymns;
    
  } catch (error) {
    console.error('Error fetching hymns by organ with Firebase SDK:', error);
    return [];
  }
}

// Get all hymns using Firebase Web SDK (no auth required for reads)
export async function getAllHymnsSDK(): Promise<Hymn[]> {
  if (!isFirebaseConfigured || !db) {
    console.warn('Firebase not configured, using offline mode');
    return [];
  }

  try {
    console.log('Getting all hymns using Firebase SDK');
    
    const hymnsRef = collection(db, 'hinos');
    const q = query(hymnsRef, orderBy('criadoEm', 'desc'));
    
    const querySnapshot = await getDocs(q);
    console.log('Firebase SDK query completed, total documents found:', querySnapshot.size);
    
    const hymns: Hymn[] = [];
    
    for (const doc of querySnapshot.docs) {
      const data = doc.data();
      
      // Get download URL for the audio file
      let audioUrl = '';
      if (data.audioPath && storage) {
        try {
          const audioRef = ref(storage, data.audioPath);
          audioUrl = await getDownloadURL(audioRef);
        } catch (error) {
          console.error('Error getting download URL for', data.audioPath, error);
          // Continue without audio URL
        }
      }
      
      const hymn: Hymn = {
        numero: data.numero || 0,
        titulo: data.titulo || '',
        orgao: data.orgao || '',
        audioPath: data.audioPath || '',
        audioUrl,
        criadoEm: data.criadoEm?.toDate?.()?.toISOString() || data.criadoEm || new Date().toISOString()
      };
      
      hymns.push(hymn);
    }
    
    console.log('Final hymns processed via SDK:', hymns.length);
    return hymns;
    
  } catch (error) {
    console.error('Error fetching all hymns with Firebase SDK:', error);
    return [];
  }
}

// Add hymn (requires authentication - keep existing REST API for writes)
export async function addHymnSDK(hymnData: Omit<Hymn, 'criadoEm'>): Promise<void> {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase not configured');
  }

  try {
    console.log('Adding hymn via Firebase SDK:', hymnData);
    
    const hymnsRef = collection(db, 'hinos');
    await addDoc(hymnsRef, {
      ...hymnData,
      criadoEm: Timestamp.now()
    });
    
    console.log('Hymn added successfully via SDK');
    
  } catch (error) {
    console.error('Error adding hymn with Firebase SDK:', error);
    throw error;
  }
}

// Upload file to Firebase Storage (requires authentication)
export async function uploadFileSDK(file: File, path: string): Promise<string> {
  if (!isFirebaseConfigured || !storage) {
    throw new Error('Firebase Storage not configured');
  }

  try {
    console.log('Uploading file via Firebase SDK:', file.name, 'to path:', path);
    
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    console.log('File uploaded successfully via SDK, download URL:', downloadURL);
    return downloadURL;
    
  } catch (error) {
    console.error('Error uploading file with Firebase SDK:', error);
    throw error;
  }
}