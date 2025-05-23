// Video Storage Service - IndexedDB implementation for large video storage
// This replaces localStorage to handle videos without quota limitations

interface VideoData {
  id: string;
  fileName: string;
  fileSize: number;
  videoBlob: Blob;
  timestamp: number;
  thumbnailUrl?: string;
}

interface StorageQuota {
  quota: number;
  usage: number;
  available: number;
}

class VideoStorageService {
  private dbName = 'LectureVideoWeaver';
  private dbVersion = 1;
  private storeName = 'videos';
  private db: IDBDatabase | null = null;

  constructor() {
    this.initDB();
  }

  // Initialize IndexedDB
  private async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('IndexedDB initialized successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('fileName', 'fileName', { unique: false });
        }
      };
    });
  }

  // Ensure DB is ready
  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.initDB();
    }
    if (!this.db) {
      throw new Error('Failed to initialize IndexedDB');
    }
    return this.db;
  }

  // Request storage quota increase
  async requestStorageQuota(): Promise<boolean> {
    try {
      // Request persistent storage
      if ('storage' in navigator && 'persist' in navigator.storage) {
        const persistent = await navigator.storage.persist();
        console.log(`Persistent storage granted: ${persistent}`);
      }

      // Estimate quota
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        console.log('Storage quota estimate:', estimate);
        
        // If quota is very low, try to request more
        if (estimate.quota && estimate.quota < 100 * 1024 * 1024) { // Less than 100MB
          console.warn('Storage quota is low, but browser-controlled');
        }
      }

      return true;
    } catch (error) {
      console.error('Error requesting storage quota:', error);
      return false;
    }
  }

  // Get current storage quota information
  async getStorageQuota(): Promise<StorageQuota> {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        return {
          quota: estimate.quota || 0,
          usage: estimate.usage || 0,
          available: (estimate.quota || 0) - (estimate.usage || 0)
        };
      }
    } catch (error) {
      console.error('Error getting storage quota:', error);
    }

    return {
      quota: 0,
      usage: 0,
      available: 0
    };
  }

  // Save video to IndexedDB
  async saveVideo(fileName: string, videoBlob: Blob, thumbnailUrl?: string): Promise<string> {
    const db = await this.ensureDB();
    const id = `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const videoData: VideoData = {
      id,
      fileName,
      fileSize: videoBlob.size,
      videoBlob,
      timestamp: Date.now(),
      thumbnailUrl
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.add(videoData);

      request.onsuccess = () => {
        console.log(`Video saved successfully: ${fileName} (${this.formatFileSize(videoBlob.size)})`);
        resolve(id);
      };

      request.onerror = () => {
        console.error('Failed to save video:', request.error);
        reject(request.error);
      };
    });
  }

  // Load video from IndexedDB
  async loadVideo(id: string): Promise<VideoData | null> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(id);

      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          console.log(`Video loaded successfully: ${result.fileName}`);
          resolve(result);
        } else {
          resolve(null);
        }
      };

      request.onerror = () => {
        console.error('Failed to load video:', request.error);
        reject(request.error);
      };
    });
  }

  // Load the most recent video (for backward compatibility)
  async loadMostRecentVideo(): Promise<VideoData | null> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('timestamp');
      const request = index.openCursor(null, 'prev'); // Get most recent

      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          resolve(cursor.value);
        } else {
          resolve(null);
        }
      };

      request.onerror = () => {
        console.error('Failed to load most recent video:', request.error);
        reject(request.error);
      };
    });
  }

  // Get all stored videos
  async getAllVideos(): Promise<VideoData[]> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        console.error('Failed to load videos:', request.error);
        reject(request.error);
      };
    });
  }

  // Delete video from IndexedDB
  async deleteVideo(id: string): Promise<boolean> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(id);

      request.onsuccess = () => {
        console.log(`Video deleted successfully: ${id}`);
        resolve(true);
      };

      request.onerror = () => {
        console.error('Failed to delete video:', request.error);
        reject(request.error);
      };
    });
  }

  // Clear all videos
  async clearAllVideos(): Promise<boolean> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();

      request.onsuccess = () => {
        console.log('All videos cleared successfully');
        resolve(true);
      };

      request.onerror = () => {
        console.error('Failed to clear videos:', request.error);
        reject(request.error);
      };
    });
  }

  // Migrate from localStorage to IndexedDB
  async migrateFromLocalStorage(storageKey: string = 'saved_video_data_new'): Promise<boolean> {
    try {
      const savedData = localStorage.getItem(storageKey);
      if (!savedData) {
        return true; // Nothing to migrate
      }

      const { fileName, fileSize, videoBlob: base64Content, timestamp } = JSON.parse(savedData);
      
      // Convert base64 back to blob
      const byteCharacters = atob(base64Content);
      const byteArrays = [];
      
      for (let offset = 0; offset < byteCharacters.length; offset += 512) {
        const slice = byteCharacters.slice(offset, offset + 512);
        const byteNumbers = new Array(slice.length);
        
        for (let i = 0; i < slice.length; i++) {
          byteNumbers[i] = slice.charCodeAt(i);
        }
        
        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
      }
      
      const blob = new Blob(byteArrays, { type: 'video/mp4' });
      
      // Save to IndexedDB
      await this.saveVideo(fileName, blob);
      
      // Remove from localStorage
      localStorage.removeItem(storageKey);
      
      console.log('Successfully migrated video from localStorage to IndexedDB');
      return true;
    } catch (error) {
      console.error('Error migrating from localStorage:', error);
      return false;
    }
  }

  // Utility function to format file sizes
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Check if storage quota is sufficient for a video
  async checkStorageSpace(videoSize: number): Promise<{ sufficient: boolean; quota: StorageQuota }> {
    const quota = await this.getStorageQuota();
    const sufficient = quota.available > videoSize;
    
    return { sufficient, quota };
  }
}

// Export singleton instance
export const videoStorageService = new VideoStorageService();
export type { VideoData, StorageQuota }; 