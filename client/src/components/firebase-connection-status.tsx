import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, Cloud, HardDrive, Database } from 'lucide-react';

// Firebase service with fallback
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

hasFirebaseService = Object.values(firebaseConfig).every(value => value);

export default function FirebaseConnectionStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [hasOffline, setHasOffline] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    setHasOffline(firebaseService.hasOfflineData());
    setLastSync(firebaseService.getLastSyncDate());

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!hasFirebaseService) {
    return (
      <Badge variant="secondary" className="bg-gray-100 text-gray-800 border-gray-200">
        <Database className="w-3 h-3 mr-1" />
        Local
      </Badge>
    );
  }

  if (isOnline) {
    return (
      <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
        <Cloud className="w-3 h-3 mr-1" />
        Online
      </Badge>
    );
  }

  if (hasOffline) {
    return (
      <div className="flex flex-col items-end space-y-1">
        <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
          <HardDrive className="w-3 h-3 mr-1" />
          Offline
        </Badge>
        {lastSync && (
          <span className="text-xs text-gray-500">
            Última sincronização: {lastSync.toLocaleDateString()}
          </span>
        )}
      </div>
    );
  }

  return (
    <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">
      <WifiOff className="w-3 h-3 mr-1" />
      Sem dados
    </Badge>
  );
}