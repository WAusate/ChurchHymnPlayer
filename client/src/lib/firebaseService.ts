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
    
    // Get next hymn number for this specific organ
    const organHymns = await getDocs(
      query(
        collection(db, HYMNS_COLLECTION),
        where('orgao', '==', orgao),
        orderBy('numero', 'desc'),
        limit(1)
      )
    );
    
    let nextNumber = 1;
    if (!organHymns.empty) {
      const lastHymn = organHymns.docs[0].data() as FirebaseHymn;
      nextNumber = lastHymn.numero + 1;
    }
    
    // Upload audio file to Storage with retry logic
    const audioPath = `hinos/${orgao.toLowerCase().replace(/\s+/g, '-')}-${nextNumber}-${Date.now()}.mp3`;
    const audioRef = ref(storage, audioPath);
    
    let uploadAttempts = 0;
    const maxAttempts = 3;
    
    while (uploadAttempts < maxAttempts) {
      try {
        await uploadBytes(audioRef, audioFile);
        break;
      } catch (uploadError) {
        uploadAttempts++;
        if (uploadAttempts >= maxAttempts) {
          throw new Error('Falha no upload do arquivo de áudio após várias tentativas');
        }
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 1000 * uploadAttempts));
      }
    }
    
    // Add hymn document to Firestore with retry logic
    let docAttempts = 0;
    let docRef;
    
    while (docAttempts < maxAttempts) {
      try {
        docRef = await addDoc(collection(db, HYMNS_COLLECTION), {
          numero: nextNumber,
          titulo,
          orgao,
          audioPath,
          criadoEm: Timestamp.now()
        });
        break;
      } catch (docError) {
        docAttempts++;
        if (docAttempts >= maxAttempts) {
          throw new Error('Falha ao salvar hino no banco de dados após várias tentativas');
        }
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 1000 * docAttempts));
      }
    }
    
    // Refresh offline data after successful addition
    try {
      await initializeOfflineData();
    } catch (offlineError) {
      console.warn('Failed to refresh offline data:', offlineError);
    }
    
    return docRef!.id;
  } catch (error: any) {
    console.error('Error adding hymn:', error);
    
    // Provide more specific error messages
    if (error?.code === 'permission-denied') {
      throw new Error('Sem permissão para adicionar hino. Verifique as configurações do Firebase.');
    } else if (error?.code === 'unavailable') {
      throw new Error('Firebase temporariamente indisponível. Tente novamente em alguns minutos.');
    } else if (error?.code === 'deadline-exceeded') {
      throw new Error('Tempo limite excedido. Verifique sua conexão com a internet.');
    } else if (error?.message?.includes('network')) {
      throw new Error('Erro de conexão. Verifique sua internet e tente novamente.');
    }
    
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