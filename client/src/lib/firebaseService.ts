import {
  collection,
  doc,
  getDocs,
  addDoc,
  query,
  where,
  orderBy,
  Timestamp,
  QuerySnapshot,
  DocumentData
} from 'firebase/firestore';
import { ref, getDownloadURL, uploadBytes } from 'firebase/storage';
import { db, storage, authReady } from './firebase';

// Firestore types
export interface FirebaseHymn {
  numero: number;
  titulo: string;
  orgao: string;
  audioPath: string;
  criadoEm: Timestamp;
}

export interface LocalHymn {
  numero: number;
  titulo: string;
  orgao: string;
  audioUrl: string;
  criadoEm: Date;
}

// Collection reference
const HYMNS_COLLECTION = 'hinos';

/**
 * Get all hymns from Firestore
 */
export async function getAllHymns(): Promise<LocalHymn[]> {
  try {
    await authReady;
    const querySnapshot = await getDocs(
      query(collection(db, HYMNS_COLLECTION), orderBy('numero', 'asc'))
    );
    
    const hymns: LocalHymn[] = [];
    
    for (const docSnap of querySnapshot.docs) {
      const data = docSnap.data() as FirebaseHymn;
      
      // Get download URL for audio file
      const audioRef = ref(storage, data.audioPath);
      const audioUrl = await getDownloadURL(audioRef);
      
      hymns.push({
        numero: data.numero,
        titulo: data.titulo,
        orgao: data.orgao,
        audioUrl,
        criadoEm: data.criadoEm.toDate()
      });
    }
    
    return hymns;
  } catch (error) {
    console.error('Error fetching hymns:', error);
    throw new Error('Erro ao carregar hinos do Firebase');
  }
}

/**
 * Get hymns by organ
 */
export async function getHymnsByOrgan(organName: string): Promise<LocalHymn[]> {
  try {
    await authReady;
    const querySnapshot = await getDocs(
      query(
        collection(db, HYMNS_COLLECTION),
        where('orgao', '==', organName),
        orderBy('numero', 'asc')
      )
    );
    
    const hymns: LocalHymn[] = [];
    
    for (const docSnap of querySnapshot.docs) {
      const data = docSnap.data() as FirebaseHymn;
      
      // Get download URL for audio file
      const audioRef = ref(storage, data.audioPath);
      const audioUrl = await getDownloadURL(audioRef);
      
      hymns.push({
        numero: data.numero,
        titulo: data.titulo,
        orgao: data.orgao,
        audioUrl,
        criadoEm: data.criadoEm.toDate()
      });
    }
    
    return hymns;
  } catch (error) {
    console.error('Error fetching hymns by organ:', error);
    throw new Error(`Erro ao carregar hinos do órgão ${organName}`);
  }
}

/**
 * Add a new hymn to Firestore
 */
export async function addHymn(
  titulo: string,
  orgao: string,
  audioFile: File
): Promise<string> {
  try {
    await authReady;
    // Get next hymn number
    const allHymns = await getDocs(collection(db, HYMNS_COLLECTION));
    const nextNumber = allHymns.size + 1;
    
    // Upload audio file to Storage
    const audioPath = `hinos/${orgao.toLowerCase()}-${nextNumber}-${Date.now()}.mp3`;
    const audioRef = ref(storage, audioPath);
    await uploadBytes(audioRef, audioFile);
    
    // Add hymn document to Firestore
    const docRef = await addDoc(collection(db, HYMNS_COLLECTION), {
      numero: nextNumber,
      titulo,
      orgao,
      audioPath,
      criadoEm: Timestamp.now()
    });
    
    return docRef.id;
  } catch (error: any) {
    console.error('Error adding hymn:', error);
    // Surface firebase error message when available
    if (error && typeof error === 'object' && 'message' in error) {
      throw new Error(`Erro ao adicionar hino: ${error.message}`);
    }
    throw new Error('Erro ao adicionar hino');
  }
}

/**
 * Initialize local storage with hymns data for offline use
 */
export async function initializeOfflineData(): Promise<void> {
  try {
    const hymns = await getAllHymns();
    
    // Store hymns data in localStorage
    localStorage.setItem('hymns_data', JSON.stringify(hymns));
    localStorage.setItem('hymns_last_sync', new Date().toISOString());
    
    console.log(`Initialized offline data with ${hymns.length} hymns`);
  } catch (error) {
    console.error('Error initializing offline data:', error);
    throw error;
  }
}

/**
 * Get hymns from local storage (offline mode)
 */
export function getOfflineHymns(): LocalHymn[] {
  try {
    const data = localStorage.getItem('hymns_data');
    if (!data) {
      return [];
    }
    
    const hymns = JSON.parse(data) as LocalHymn[];
    // Convert date strings back to Date objects
    return hymns.map(hymn => ({
      ...hymn,
      criadoEm: new Date(hymn.criadoEm)
    }));
  } catch (error) {
    console.error('Error getting offline hymns:', error);
    return [];
  }
}

/**
 * Get hymns by organ from local storage (offline mode)
 */
export function getOfflineHymnsByOrgan(organName: string): LocalHymn[] {
  const allHymns = getOfflineHymns();
  return allHymns.filter(hymn => hymn.orgao === organName);
}

/**
 * Check if offline data is available
 */
export function hasOfflineData(): boolean {
  return localStorage.getItem('hymns_data') !== null;
}

/**
 * Check when was the last sync
 */
export function getLastSyncDate(): Date | null {
  const lastSync = localStorage.getItem('hymns_last_sync');
  return lastSync ? new Date(lastSync) : null;
}