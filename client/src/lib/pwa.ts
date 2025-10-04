export interface PWAUpdateInfo {
  hasUpdate: boolean;
  waitingWorker?: ServiceWorker;
}

export class PWAManager {
  private registration: ServiceWorkerRegistration | null = null;
  private onUpdateCallback: ((info: PWAUpdateInfo) => void) | null = null;

  async register(): Promise<ServiceWorkerRegistration | null> {
    if (!('serviceWorker' in navigator)) {
      console.log('[PWA] Service Worker not supported');
      return null;
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('[PWA] Service Worker registered successfully');

      this.registration.addEventListener('updatefound', () => {
        const newWorker = this.registration?.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[PWA] New version available');
              if (this.onUpdateCallback) {
                this.onUpdateCallback({
                  hasUpdate: true,
                  waitingWorker: newWorker
                });
              }
            }
          });
        }
      });

      if (this.registration.waiting) {
        if (this.onUpdateCallback) {
          this.onUpdateCallback({
            hasUpdate: true,
            waitingWorker: this.registration.waiting
          });
        }
      }

      return this.registration;
    } catch (error) {
      console.error('[PWA] Service Worker registration failed:', error);
      return null;
    }
  }

  async checkForUpdates(): Promise<boolean> {
    if (!this.registration) {
      console.log('[PWA] No registration available');
      return false;
    }

    try {
      await this.registration.update();
      console.log('[PWA] Update check completed');
      return true;
    } catch (error) {
      console.error('[PWA] Update check failed:', error);
      return false;
    }
  }

  activateUpdate() {
    if (this.registration?.waiting) {
      this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  }

  onUpdate(callback: (info: PWAUpdateInfo) => void) {
    this.onUpdateCallback = callback;
  }

  async clearCache(): Promise<void> {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      console.log('[PWA] All caches cleared');
    }
  }

  async getCacheSize(): Promise<number> {
    if (!('caches' in window)) return 0;

    let totalSize = 0;
    const cacheNames = await caches.keys();

    for (const name of cacheNames) {
      const cache = await caches.open(name);
      const requests = await cache.keys();

      for (const request of requests) {
        const response = await cache.match(request);
        if (response) {
          const blob = await response.blob();
          totalSize += blob.size;
        }
      }
    }

    return totalSize;
  }

  isOnline(): boolean {
    return navigator.onLine;
  }

  onOnlineStatusChange(callback: (isOnline: boolean) => void) {
    window.addEventListener('online', () => callback(true));
    window.addEventListener('offline', () => callback(false));
  }
}

export const pwaManager = new PWAManager();

export async function requestPersistentStorage(): Promise<boolean> {
  if (navigator.storage && navigator.storage.persist) {
    const isPersisted = await navigator.storage.persist();
    console.log(`[PWA] Persistent storage: ${isPersisted ? 'granted' : 'denied'}`);
    return isPersisted;
  }
  return false;
}

export async function checkStorageQuota(): Promise<{ usage: number; quota: number } | null> {
  if (navigator.storage && navigator.storage.estimate) {
    const estimate = await navigator.storage.estimate();
    return {
      usage: estimate.usage || 0,
      quota: estimate.quota || 0
    };
  }
  return null;
}
