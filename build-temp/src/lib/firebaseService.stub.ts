// Stub file for Firebase service when Firebase is not configured
export interface LocalHymn {
  numero: number;
  titulo: string;
  orgao: string;
  audioUrl: string;
  criadoEm: Date;
}

export async function getAllHymns(): Promise<LocalHymn[]> {
  return [];
}

export async function getHymnsByOrgan(organName: string): Promise<LocalHymn[]> {
  return [];
}

export async function addHymn(
  titulo: string,
  orgao: string,
  audioFile: File
): Promise<void> {
  throw new Error('Firebase not configured');
}

export async function initializeOfflineData(): Promise<void> {
  throw new Error('Firebase not configured');
}

export function getOfflineHymns(): LocalHymn[] {
  return [];
}

export function getOfflineHymnsByOrgan(organName: string): LocalHymn[] {
  return [];
}

export function hasOfflineData(): boolean {
  return false;
}

export function getLastSyncDate(): Date | null {
  return null;
}