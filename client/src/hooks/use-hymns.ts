import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { HymnData } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';

// Firebase imports with error handling
let firebaseService: any = null;
try {
  firebaseService = require('@/lib/firebaseService');
} catch (error) {
  console.log('Firebase not configured, using fallback mode');
}

export function useHymns(organKey: string) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isInitialized, setIsInitialized] = useState(false);
  const [fallbackData, setFallbackData] = useState<HymnData[]>([]);
  const [loadingFallback, setLoadingFallback] = useState(false);
  const { toast } = useToast();

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

  // Load fallback data from JSON files
  useEffect(() => {
    const loadFallbackData = async () => {
      if (!firebaseService && organKey) {
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
      if (firebaseService && isOnline && !firebaseService.hasOfflineData() && !isInitialized) {
        try {
          setIsInitialized(true);
          await firebaseService.initializeOfflineData();
          toast({
            title: "Dados sincronizados",
            description: "Hinos baixados para uso offline.",
          });
        } catch (error) {
          console.error('Failed to initialize offline data:', error);
          toast({
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
    queryKey: ['hymns', organKey, 'online'],
    queryFn: async () => {
      if (!firebaseService) {
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
    enabled: Boolean(firebaseService) && isOnline && Boolean(organKey),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  // Get offline data
  const getOfflineData = () => {
    if (!firebaseService || !organKey) return [];
    
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

  if (!firebaseService) {
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