import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { HymnData } from '@shared/schema';
import { showSimpleToast } from '@/components/simple-toast';
import { getHymnsByOrganSDK, type Hymn } from '@/lib/firebaseSDK';
import { isFirebaseConfigured } from '@/lib/firebase';

// Organ name mapping
const organNameMap: Record<string, string> = {
  'coral': 'Coral',
  'conjunto-musical': 'Conjunto Musical',
  'criancas': 'Crianças',
  'proati': 'PROATI',
  'uniao-adolescentes': 'União de Adolescentes',
  'grupo-jovem': 'Grupo Jovem',
  'comissao': 'Comissão',
  'campanha': 'Campanha'
};

export function useHymns(organKey: string) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isInitialized, setIsInitialized] = useState(false);
  const [fallbackData, setFallbackData] = useState<HymnData[]>([]);
  const [loadingFallback, setLoadingFallback] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  // Using simple toast to avoid DOM conflicts

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Listen for hymn-added events to trigger refresh
  useEffect(() => {
    const handleHymnAdded = (event: CustomEvent) => {
      // Immediate refresh without delays
      setRefreshTrigger(prev => prev + 1);
    };

    window.addEventListener('hymn-added', handleHymnAdded as any);

    return () => {
      window.removeEventListener('hymn-added', handleHymnAdded as any);
    };
  }, []);

  // Load fallback data from JSON files if Firebase not configured
  useEffect(() => {
    const loadFallbackData = async () => {
      if (!isFirebaseConfigured && organKey) {
        setLoadingFallback(true);
        try {
          const response = await fetch(`/data/hymns/${organKey}.json`);
          if (response.ok) {
            const data = await response.json();
            setFallbackData(data);
          }
        } catch (error) {
          console.error('Error loading fallback data:', error);
        } finally {
          setLoadingFallback(false);
        }
      }
    };

    loadFallbackData();
  }, [organKey]);

  // Mark as initialized when Firebase is available
  useEffect(() => {
    if (isFirebaseConfigured && isOnline && !isInitialized) {
      setIsInitialized(true);
    }
  }, [isOnline, isInitialized]);

  // Query for hymns using Firebase SDK (no authentication required for reading)
  const hymnsQuery = useQuery({
    queryKey: ['hymns', organKey, 'sdk', refreshTrigger],
    queryFn: async () => {
      if (!isFirebaseConfigured) {
        throw new Error('Firebase not configured');
      }
      
      const organName = organNameMap[organKey];
      if (!organName) {
        throw new Error('Órgão não encontrado');
      }
      
      return await getHymnsByOrganSDK(organName);
    },
    enabled: isFirebaseConfigured && Boolean(organKey),
    staleTime: 30000, // Cache for 30 seconds
    retry: 3,
  });

  // Determine which data to use
  let hymns: HymnData[] = [];
  let firebaseHymns: Hymn[] = [];
  let isLoading = false;
  let error = null;

  if (!isFirebaseConfigured) {
    // Fallback mode - use JSON files
    hymns = fallbackData;
    isLoading = loadingFallback;
    firebaseHymns = [];
  } else {
    // Firebase SDK mode
    const fbHymns = hymnsQuery.data || [];
    
    firebaseHymns = fbHymns;
    hymns = fbHymns.map((hymn: Hymn) => ({
      titulo: hymn.titulo,
      url: hymn.audioUrl || ''
    }));
    
    isLoading = hymnsQuery.isLoading;
    error = hymnsQuery.error;
  }

  return {
    hymns,
    firebaseHymns,
    isLoading,
    error,
    isOnline,
    hasOfflineData: false, // Offline data handled by browser cache now
    refetch: hymnsQuery?.refetch
  };
}

export function useHymnByIndex(organKey: string, hymnIndex: number) {
  const { hymns, firebaseHymns, isLoading, error, isOnline } = useHymns(organKey);
  
  const hymn = hymns[hymnIndex] || null;
  const firebaseHymn = firebaseHymns[hymnIndex] || null;

  return {
    hymn,
    firebaseHymn,
    isLoading,
    error,
    isOnline
  };
}