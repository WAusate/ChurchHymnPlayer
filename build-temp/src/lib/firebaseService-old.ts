import {
  collection,
  doc,
  getDocs,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  QuerySnapshot,
  DocumentData
} from 'firebase/firestore';
import { ref, getDownloadURL, uploadBytes, uploadBytesResumable, deleteObject } from 'firebase/storage';
import { db, storage, auth, authReady } from './firebase';
import { 
  uploadFileToStorage, 
  getDownloadUrl, 
  addDocumentToFirestore, 
  getDocumentsFromFirestore,
  getNextHymnNumber 
} from './firebase-rest';

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
 * Add a new hymn to Firestore - REST API version to bypass WebChannel transport issues
 */
export async function addHymn(
  titulo: string,
  orgao: string,
  audioFile: File,
  progressCallback?: (progress: number, status: string) => void
): Promise<string> {
  try {
    progressCallback?.(5, 'Verificando autenticação...');
    await authReady;
    
    // Check if user is authenticated
    if (!auth?.currentUser) {
      throw new Error('Usuário não autenticado. Recarregue a página e tente novamente.');
    }
    
    progressCallback?.(10, 'Calculando número do hino...');
    
    // Get next hymn number using REST API
    let nextNumber: number;
    try {
      nextNumber = await getNextHymnNumber(orgao);
    } catch (error) {
      console.warn('Error getting hymn number, using random:', error);
      nextNumber = Math.floor(Math.random() * 9000) + 1000;
    }
    
    // Upload audio file to Storage using REST API
    const audioPath = `hinos/${orgao.toLowerCase().replace(/\s+/g, '-')}-${nextNumber}-${Date.now()}.mp3`;
    
    progressCallback?.(15, 'Iniciando upload do arquivo...');
    
    try {
      // Upload file with progress tracking
      await uploadFileToStorage(audioFile, audioPath, (progress) => {
        const adjustedProgress = (progress * 0.65) + 15; // 15-80%
        progressCallback?.(adjustedProgress, `Enviando arquivo... ${Math.round(progress)}%`);
      });
      
      progressCallback?.(80, 'Upload do arquivo concluído');
    } catch (uploadError: any) {
      console.error('Upload error:', uploadError);
      
      if (uploadError.message?.includes('unauthorized')) {
        throw new Error('Sem permissão para upload. Verifique as regras do Firebase Storage.');
      } else if (uploadError.message?.includes('network')) {
        throw new Error('Erro de conexão no upload. Verifique sua internet.');
      } else {
        throw new Error(`Erro no upload: ${uploadError.message || 'Erro desconhecido'}`);
      }
    }
    
    // Add hymn document to Firestore using REST API
    progressCallback?.(85, 'Salvando informações do hino...');
    
    let docId: string;
    try {
      docId = await addDocumentToFirestore(HYMNS_COLLECTION, {
        numero: nextNumber,
        titulo,
        orgao,
        audioPath
      });
    } catch (firestoreError: any) {
      console.error('Firestore error:', firestoreError);
      
      // Try to clean up the uploaded file
      try {
        // Note: REST API cleanup would need additional implementation
        console.warn('Upload successful but Firestore save failed. Manual cleanup may be needed.');
      } catch (cleanupError) {
        console.warn('Could not clean up uploaded file:', cleanupError);
      }
      
      if (firestoreError.message?.includes('permission')) {
        throw new Error('Sem permissão para salvar no Firestore. Verifique as regras do Firebase.');
      } else if (firestoreError.message?.includes('401')) {
        throw new Error('Erro de autenticação. Recarregue a página e tente novamente.');
      } else {
        throw new Error(`Erro ao salvar no Firestore: ${firestoreError.message || 'Erro desconhecido'}`);
      }
    }
    
    // Refresh offline data after successful addition
    progressCallback?.(95, 'Atualizando dados locais...');
    try {
      await initializeOfflineData();
    } catch (offlineError) {
      console.warn('Failed to refresh offline data:', offlineError);
    }
    
    progressCallback?.(100, 'Hino adicionado com sucesso!');
    return docId;
  } catch (error: any) {
    console.error('Error adding hymn:', error);
    
    // Surface specific error messages
    if (error.message) {
      throw error; // Re-throw with original message
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