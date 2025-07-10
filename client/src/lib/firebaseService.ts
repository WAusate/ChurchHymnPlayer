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
import { ref, getDownloadURL, uploadBytes, uploadBytesResumable } from 'firebase/storage';
import { db, storage, auth, authReady } from './firebase';

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
  audioFile: File,
  progressCallback?: (progress: number, status: string) => void
): Promise<string> {
  try {
    progressCallback?.(5, 'Verificando autenticação...');
    await authReady;
    
    // Check if user is authenticated
    if (!auth.currentUser) {
      throw new Error('Usuário não autenticado. Recarregue a página e tente novamente.');
    }
    
    progressCallback?.(10, 'Calculando número do hino...');
    
    // Get next hymn number for this specific organ with better error handling
    let nextNumber = 1;
    try {
      const organHymns = await getDocs(
        query(
          collection(db, HYMNS_COLLECTION),
          where('orgao', '==', orgao),
          orderBy('numero', 'desc'),
          limit(1)
        )
      );
      
      if (!organHymns.empty) {
        const lastHymn = organHymns.docs[0].data() as FirebaseHymn;
        nextNumber = lastHymn.numero + 1;
      }
    } catch (queryError) {
      console.warn('Error getting hymn number, using default:', queryError);
      // Fallback: try to get all hymns for this organ and count
      try {
        const allOrganHymns = await getDocs(
          query(collection(db, HYMNS_COLLECTION), where('orgao', '==', orgao))
        );
        nextNumber = allOrganHymns.size + 1;
      } catch (fallbackError) {
        console.warn('Fallback query failed, using random number:', fallbackError);
        nextNumber = Math.floor(Math.random() * 9000) + 1000; // Random 4-digit number
      }
    }
    
    // Upload audio file to Storage with progress tracking
    const audioPath = `hinos/${orgao.toLowerCase().replace(/\s+/g, '-')}-${nextNumber}-${Date.now()}.mp3`;
    const audioRef = ref(storage, audioPath);
    
    progressCallback?.(15, 'Iniciando upload do arquivo...');
    
    // Add timeout and better error handling for upload
    const uploadPromise = new Promise<void>((resolve, reject) => {
      const uploadTask = uploadBytesResumable(audioRef, audioFile);
      
      // Set timeout for upload (5 minutes)
      const timeout = setTimeout(() => {
        uploadTask.cancel();
        reject(new Error('Upload interrompido por timeout (5 minutos)'));
      }, 5 * 60 * 1000);
      
      uploadTask.on('state_changed',
        (snapshot) => {
          // Progress monitoring
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 65 + 15; // 15-80%
          progressCallback?.(progress, `Enviando arquivo... ${Math.round(progress - 15)}%`);
        },
        (error) => {
          // Handle errors
          clearTimeout(timeout);
          console.error('Upload error:', error);
          
          if (error.code === 'storage/unauthorized') {
            reject(new Error('Sem permissão para upload. Verifique as regras do Firebase Storage.'));
          } else if (error.code === 'storage/canceled') {
            reject(new Error('Upload cancelado.'));
          } else if (error.code === 'storage/unknown') {
            reject(new Error('Erro desconhecido no upload. Verifique sua conexão.'));
          } else {
            reject(new Error(`Erro no upload: ${error.message || 'Erro desconhecido'}`));
          }
        },
        () => {
          // Upload completed successfully
          clearTimeout(timeout);
          progressCallback?.(80, 'Upload do arquivo concluído');
          resolve();
        }
      );
    });
    
    await uploadPromise;
    
    // Add hymn document to Firestore
    progressCallback?.(85, 'Salvando informações do hino...');
    
    const docRef = await addDoc(collection(db, HYMNS_COLLECTION), {
      numero: nextNumber,
      titulo,
      orgao,
      audioPath,
      criadoEm: Timestamp.now()
    });
    
    // Refresh offline data after successful addition
    progressCallback?.(95, 'Atualizando dados locais...');
    try {
      await initializeOfflineData();
    } catch (offlineError) {
      console.warn('Failed to refresh offline data:', offlineError);
    }
    
    progressCallback?.(100, 'Hino adicionado com sucesso!');
    return docRef.id;
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