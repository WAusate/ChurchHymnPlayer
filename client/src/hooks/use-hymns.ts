import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { HymnData } from '@shared/schema';
import { useSafeToast } from '@/components/safe-toast-provider';
// Remove DOM utils import as we're eliminating direct DOM manipulation

// Firebase imports with error handling
import * as firebaseStub from '@/lib/firebaseService.stub';

let firebaseService: any = firebaseStub;
let hasFirebaseService = false;

// Check if Firebase is configured
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const hasFirebaseConfig = Object.values(firebaseConfig).every(
  value => value && !String(value).startsWith('your_')
);

if (hasFirebaseConfig) {
  try {
    // Import Firebase service dynamically
    import('@/lib/firebaseService').then(module => {
      firebaseService = module;
      hasFirebaseService = true;
    }).catch(error => {
      console.log('Firebase service import failed:', error);
    });
  } catch (error) {
    console.log('Firebase not configured, using fallback mode');
  }
}

export function useHymns(organKey: string) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isInitialized, setIsInitialized] = useState(false);
  const [fallbackData, setFallbackData] = useState<HymnData[]>([]);
  const [loadingFallback, setLoadingFallback] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { showToast } = useSafeToast();

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

  // Load fallback data from JSON files
  useEffect(() => {
    const loadFallbackData = async () => {
      if (!hasFirebaseService && organKey) {
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

  // Initialize offline data if Firebase is available
  useEffect(() => {
    const initializeData = async () => {
      if (hasFirebaseService && isOnline && !firebaseService.hasOfflineData() && !isInitialized) {
        try {
          setIsInitialized(true);
          await firebaseService.initializeOfflineData();
          showToast({
            title: "Dados sincronizados",
            description: "Hinos baixados para uso offline.",
          });
        } catch (error) {
          console.error('Failed to initialize offline data:', error);
          showToast({
            title: "Erro na sincronização",
            description: "Não foi possível baixar os dados para uso offline.",
            variant: "destructive",
          });
        }
      }
    };

    initializeData();
  }, [isOnline, isInitialized, toast]);

  // Query for online data (only if Firebase is available)
  const onlineQuery = useQuery({
    queryKey: ['hymns', organKey, 'online', refreshTrigger],
    queryFn: async () => {
      if (!hasFirebaseService) {
        throw new Error('Firebase not configured');
      }
      
      const organNameMap: Record<string, string> = {
        'coral': 'Coral',
        'conjunto-musical': 'Conjunto Musical',
        'criancas': 'Crianças',
        'proat': 'Proat',
        'uniao-adolescentes': 'União de Adolescentes',
        'grupo-jovem': 'Grupo Jovem',
        'comissao': 'Comissão',
        'campanha': 'Campanha'
      };
      
      const organName = organNameMap[organKey];
      if (!organName) {
        throw new Error('Órgão não encontrado');
      }
      
      return await firebaseService.getHymnsByOrgan(organName);
    },
    enabled: hasFirebaseService && isOnline && Boolean(organKey),
    staleTime: 0, // Don't cache to always get fresh data
    retry: 3,
  });

  // Get offline data
  const getOfflineData = () => {
    if (!hasFirebaseService || !organKey) return [];
    
    const organNameMap: Record<string, string> = {
      'coral': 'Coral',
      'conjunto-musical': 'Conjunto Musical',
      'criancas': 'Crianças',
      'proat': 'Proat',
      'uniao-adolescentes': 'União de Adolescentes',
      'grupo-jovem': 'Grupo Jovem',
      'comissao': 'Comissão',
      'campanha': 'Campanha'
    };
    
    const organName = organNameMap[organKey];
    return organName ? firebaseService.getOfflineHymnsByOrgan(organName) : [];
  };

  // Determine which data to use
  let hymns: HymnData[] = [];
  let firebaseHymns: any[] = [];
  let isLoading = false;
  let error = null;
  let hasOffline = false;

  if (!hasFirebaseService) {
    // Fallback mode - use JSON files
    hymns = fallbackData;
    isLoading = loadingFallback;
  } else {
    // Firebase mode
    const offlineData = !isOnline || onlineQuery.isError ? getOfflineData() : [];
    const fbHymns = isOnline && onlineQuery.data ? onlineQuery.data : offlineData;
    
    firebaseHymns = fbHymns;
    hymns = fbHymns.map((hymn: any) => ({
      titulo: hymn.titulo,
      url: hymn.audioUrl
    }));
    
    isLoading = isOnline ? onlineQuery.isLoading : false;
    error = isOnline ? onlineQuery.error : null;
    hasOffline = firebaseService.hasOfflineData();
  }

  return {
    hymns,
    firebaseHymns,
    isLoading,
    error,
    isOnline,
    hasOfflineData: hasOffline,
    refetch: onlineQuery?.refetch
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