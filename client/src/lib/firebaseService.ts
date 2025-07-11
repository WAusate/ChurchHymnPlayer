import { Timestamp } from 'firebase/firestore';
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

// Helper function to clean URLs
function cleanAudioUrl(url: string): string {
  return url.trim().replace(/\n/g, '').replace(/\r/g, '').replace(/\s+/g, ' ').trim();
}

/**
 * Get all hymns from Firestore using REST API to avoid query limitations
 */
export async function getAllHymns(): Promise<LocalHymn[]> {
  try {
    await authReady;
    
    // Use REST API instead of SDK to avoid failed-precondition errors
    const firestoreHymns = await getDocumentsFromFirestore(HYMNS_COLLECTION);
    
    // Sort hymns by numero
    firestoreHymns.sort((a, b) => a.numero - b.numero);
    
    const hymns: LocalHymn[] = [];
    
    for (const data of firestoreHymns) {
      try {
        // Get download URL for audio file using improved method
        let audioUrl: string;
        
        if (data.audioPath.startsWith('http')) {
          // If it's already a full URL, use it directly but clean it
          audioUrl = data.audioPath.trim();
        } else {
          // Use our improved getDownloadUrl function
          console.log(`Getting download URL for hymn ${data.numero} with path: ${data.audioPath}`);
          audioUrl = await getDownloadUrl(data.audioPath);
          console.log(`Got download URL for hymn ${data.numero}: ${audioUrl}`);
        }
        
        // Clean the URL to remove any trailing whitespace/newlines
        audioUrl = audioUrl.trim();
        
        hymns.push({
          numero: data.numero,
          titulo: data.titulo,
          orgao: data.orgao,
          audioUrl,
          criadoEm: data.criadoEm
        });
      } catch (urlError) {
        console.warn(`Failed to get URL for hymn ${data.numero}:`, urlError);
        // Still add the hymn but without working audio URL
        hymns.push({
          numero: data.numero,
          titulo: data.titulo,
          orgao: data.orgao,
          audioUrl: '', // Empty URL will be handled by the audio player
          criadoEm: data.criadoEm
        });
      }
    }
    
    return hymns;
  } catch (error) {
    console.error('Error fetching hymns with REST API:', error);
    throw new Error('Erro ao carregar hinos do Firebase');
  }
}

/**
 * Get hymns by organ using REST API to avoid query limitations
 */
export async function getHymnsByOrgan(organName: string): Promise<LocalHymn[]> {
  try {
    console.log('getHymnsByOrgan called with organName:', organName);
    await authReady;
    
    // Use REST API instead of SDK to avoid failed-precondition errors
    const firestoreHymns = await getDocumentsFromFirestore(HYMNS_COLLECTION);
    console.log('Firestore hymns retrieved:', firestoreHymns.length);
    
    // Filter by organ and sort by numero on client side
    const organHymns = firestoreHymns
      .filter(hymn => hymn.orgao === organName)
      .sort((a, b) => a.numero - b.numero);
    
    console.log(`Hymns for organ "${organName}":`, organHymns.length);
    
    const hymns: LocalHymn[] = [];
    
    for (const data of organHymns) {
      try {
        // Get download URL for audio file using improved method
        let audioUrl: string;
        
        if (data.audioPath.startsWith('http')) {
          // If it's already a full URL, use it directly but clean it
          audioUrl = data.audioPath.trim();
        } else {
          // Use our improved getDownloadUrl function
          console.log(`Getting download URL for hymn ${data.numero} with path: ${data.audioPath}`);
          audioUrl = await getDownloadUrl(data.audioPath);
          console.log(`Got download URL for hymn ${data.numero}: ${audioUrl}`);
        }
        
        // Clean the URL to remove any trailing whitespace/newlines
        audioUrl = audioUrl.trim();
        
        hymns.push({
          numero: data.numero,
          titulo: data.titulo,
          orgao: data.orgao,
          audioUrl,
          criadoEm: data.criadoEm
        });
      } catch (urlError) {
        console.warn(`Failed to get URL for hymn ${data.numero} (${organName}):`, urlError);
        // Still add the hymn but without working audio URL
        hymns.push({
          numero: data.numero,
          titulo: data.titulo,
          orgao: data.orgao,
          audioUrl: '', // Empty URL will be handled by the audio player
          criadoEm: data.criadoEm
        });
      }
    }
    
    console.log('Final hymns processed:', hymns.length);
    return hymns;
  } catch (error) {
    console.error('Error fetching hymns by organ with REST API:', error);
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
      console.log('About to upload file:', audioFile.name, 'to path:', audioPath);
      
      // Upload file with progress tracking
      await uploadFileToStorage(audioFile, audioPath, (progress) => {
        const adjustedProgress = (progress * 0.65) + 15; // 15-80%
        progressCallback?.(adjustedProgress, `Enviando arquivo... ${Math.round(progress)}%`);
      });
      
      console.log('Upload completed successfully');
      progressCallback?.(80, 'Upload do arquivo concluído');
    } catch (uploadError: any) {
      console.error('Upload error:', uploadError);
      console.error('Upload error type:', typeof uploadError);
      console.error('Upload error message:', uploadError?.message);
      console.error('Upload error stack:', uploadError?.stack);
      
      if (uploadError?.message?.includes('unauthorized')) {
        throw new Error('Sem permissão para upload. Verifique as regras do Firebase Storage.');
      } else if (uploadError?.message?.includes('network')) {
        throw new Error('Erro de conexão no upload. Verifique sua internet.');
      } else {
        throw new Error(`Erro no upload: ${uploadError?.message || JSON.stringify(uploadError) || 'Erro desconhecido'}`);
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
    
    progressCallback?.(95, 'Atualizando dados locais...');
    
    // Trigger hymn list refresh
    try {
      await refreshOfflineData();
    } catch (error) {
      console.warn('Failed to refresh offline data:', error);
    }
    
    progressCallback?.(100, 'Hino adicionado com sucesso!');
    
    return docId;
  } catch (error: any) {
    console.error('Error adding hymn:', error);
    throw new Error(error.message || 'Erro ao adicionar hino');
  }
}

/**
 * Initialize local storage with hymns data for offline use
 */
export async function initializeOfflineData(): Promise<void> {
  try {
    await authReady;
    
    // Use REST API to get all hymns
    const firestoreHymns = await getDocumentsFromFirestore(HYMNS_COLLECTION);
    
    // Convert to LocalHymn format with proper URLs
    const localHymns: LocalHymn[] = [];
    
    for (const hymn of firestoreHymns) {
      try {
        let audioUrl: string;
        
        if (hymn.audioPath.startsWith('http')) {
          audioUrl = hymn.audioPath;
        } else {
          audioUrl = await getDownloadUrl(hymn.audioPath);
        }
        
        localHymns.push({
          numero: hymn.numero,
          titulo: hymn.titulo,
          orgao: hymn.orgao,
          audioUrl,
          criadoEm: hymn.criadoEm
        });
      } catch (urlError) {
        console.warn(`Failed to get URL for hymn ${hymn.numero}:`, urlError);
        // Still add the hymn but without working audio URL
        localHymns.push({
          numero: hymn.numero,
          titulo: hymn.titulo,
          orgao: hymn.orgao,
          audioUrl: '',
          criadoEm: hymn.criadoEm
        });
      }
    }
    
    // Store in localStorage
    localStorage.setItem('hymns_offline_data', JSON.stringify(localHymns));
    localStorage.setItem('hymns_last_sync', new Date().toISOString());
    
    console.log('Offline data initialized with', localHymns.length, 'hymns');
  } catch (error) {
    console.error('Error initializing offline data:', error);
    throw new Error('Erro ao inicializar dados offline');
  }
}

/**
 * Refresh offline data with latest from Firestore
 */
export async function refreshOfflineData(): Promise<void> {
  await initializeOfflineData();
}

/**
 * Get hymns from local storage (offline mode)
 */
export function getOfflineHymns(): LocalHymn[] {
  try {
    const data = localStorage.getItem('hymns_offline_data');
    if (!data) return [];
    
    return JSON.parse(data).map((hymn: any) => ({
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
  return getOfflineHymns().filter(hymn => hymn.orgao === organName);
}

/**
 * Check if offline data is available
 */
export function hasOfflineData(): boolean {
  return localStorage.getItem('hymns_offline_data') !== null;
}

/**
 * Check when was the last sync
 */
export function getLastSyncDate(): Date | null {
  try {
    const lastSync = localStorage.getItem('hymns_last_sync');
    return lastSync ? new Date(lastSync) : null;
  } catch (error) {
    console.error('Error getting last sync date:', error);
    return null;
  }
}