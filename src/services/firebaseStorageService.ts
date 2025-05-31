// Firebase Storage Service - Cloud storage implementation for video management
// This replaces IndexedDB to store videos in Firebase Storage

import { ref, uploadBytes, getDownloadURL, deleteObject, listAll } from 'firebase/storage';
import { storage } from '@/lib/firebase';

interface VideoData {
  id: string;
  fileName: string;
  fileSize: number;
  downloadUrl: string;
  timestamp: number;
  thumbnailUrl?: string;
}

interface StorageQuota {
  quota: number;
  usage: number;
  available: number;
}

class FirebaseStorageService {
  private videosRef = ref(storage, 'videos');

  // Save video to Firebase Storage
  async saveVideo(fileName: string, videoBlob: Blob, thumbnailUrl?: string): Promise<string> {
    const timestamp = Date.now();
    const id = `video_${timestamp}_${Math.random().toString(36).substr(2, 9)}`;
    const videoRef = ref(storage, `videos/${id}_${fileName}`);
    
    try {
      // Upload video blob to Firebase Storage
      const snapshot = await uploadBytes(videoRef, videoBlob);
      const downloadUrl = await getDownloadURL(snapshot.ref);
      
      // Store video metadata in localStorage for quick access
      const videoData: VideoData = {
        id,
        fileName,
        fileSize: videoBlob.size,
        downloadUrl,
        timestamp,
        thumbnailUrl
      };
      
      this.saveVideoMetadata(videoData);
      
      console.log(`Video saved successfully to Firebase: ${fileName} (${this.formatFileSize(videoBlob.size)})`);
      return id;
    } catch (error) {
      console.error('Failed to save video to Firebase:', error);
      throw error;
    }
  }

  // Load video from Firebase Storage
  async loadVideo(id: string): Promise<VideoData | null> {
    try {
      const videoData = this.getVideoMetadata(id);
      if (!videoData) {
        return null;
      }
      
      // Verify the download URL is still valid
      try {
        const response = await fetch(videoData.downloadUrl, { method: 'HEAD' });
        if (!response.ok) {
          // Remove invalid metadata
          this.removeVideoMetadata(id);
          return null;
        }
      } catch (error) {
        console.error('Video URL no longer accessible:', error);
        this.removeVideoMetadata(id);
        return null;
      }
      
      console.log(`Video loaded successfully from Firebase: ${videoData.fileName}`);
      return videoData;
    } catch (error) {
      console.error('Failed to load video from Firebase:', error);
      throw error;
    }
  }

  // Get all stored videos from backend API
  async getAllVideos(): Promise<VideoData[]> {
    try {
      const response = await fetch('http://176.119.254.185:7111/list-videos');
      if (!response.ok) {
        throw new Error('Failed to fetch videos from backend');
      }
      
      const data = await response.json();
      const videos: VideoData[] = data.videos.map((video: any) => ({
        id: video.name.replace('videos/', '').replace('.mp4', ''),
        fileName: video.file_name,
        fileSize: video.size,
        downloadUrl: video.download_url,
        timestamp: video.created ? new Date(video.created).getTime() : Date.now()
      }));
      
      // Update local metadata cache
      videos.forEach(video => this.saveVideoMetadata(video));
      
      return videos.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('Failed to load videos from Firebase:', error);
      // Fallback to local metadata if backend is unavailable
      return this.getLocalVideoMetadata();
    }
  }

  // Delete video from Firebase Storage
  async deleteVideo(id: string): Promise<boolean> {
    try {
      const videoData = this.getVideoMetadata(id);
      if (!videoData) {
        console.warn(`Video metadata not found for id: ${id}`);
        return false;
      }
      
      // Delete from backend via API
      const response = await fetch('http://176.119.254.185:7111/delete-video', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          video_name: `videos/${id}_${videoData.fileName}`
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete video from backend');
      }
      
      // Remove from local metadata
      this.removeVideoMetadata(id);
      
      console.log(`Video deleted successfully from Firebase: ${id}`);
      return true;
    } catch (error) {
      console.error('Failed to delete video from Firebase:', error);
      throw error;
    }
  }

  // Load the most recent video
  async loadMostRecentVideo(): Promise<VideoData | null> {
    try {
      const videos = await this.getAllVideos();
      return videos.length > 0 ? videos[0] : null;
    } catch (error) {
      console.error('Failed to load most recent video:', error);
      return null;
    }
  }

  // Clear all videos (for cleanup)
  async clearAllVideos(): Promise<boolean> {
    try {
      const videos = await this.getAllVideos();
      const deletePromises = videos.map(video => this.deleteVideo(video.id));
      await Promise.all(deletePromises);
      
      // Clear local metadata
      localStorage.removeItem('firebase_videos_metadata');
      
      console.log('All videos cleared successfully from Firebase');
      return true;
    } catch (error) {
      console.error('Failed to clear videos from Firebase:', error);
      return false;
    }
  }

  // Get storage quota (Firebase doesn't have the same quota system as IndexedDB)
  async getStorageQuota(): Promise<StorageQuota> {
    // Firebase Storage quotas are managed differently
    // Return a large quota to indicate cloud storage availability
    return {
      quota: 100 * 1024 * 1024 * 1024, // 100GB (theoretical)
      usage: 0, // Would need backend API to calculate actual usage
      available: 100 * 1024 * 1024 * 1024
    };
  }

  // Check storage space (always sufficient for Firebase)
  async checkStorageSpace(videoSize: number): Promise<{ sufficient: boolean; quota: StorageQuota }> {
    const quota = await this.getStorageQuota();
    return { sufficient: true, quota };
  }

  // Request storage quota (not applicable to Firebase)
  async requestStorageQuota(): Promise<boolean> {
    return true; // Firebase handles quota automatically
  }

  // Migration method (for compatibility)
  async migrateFromLocalStorage(storageKey: string = 'saved_video_data_new'): Promise<boolean> {
    // This method can be used to migrate from IndexedDB if needed
    return true;
  }

  // Utility methods for metadata management
  private saveVideoMetadata(videoData: VideoData): void {
    const existingData = this.getLocalVideoMetadata();
    const updatedData = existingData.filter(v => v.id !== videoData.id);
    updatedData.push(videoData);
    localStorage.setItem('firebase_videos_metadata', JSON.stringify(updatedData));
  }

  private getVideoMetadata(id: string): VideoData | null {
    const videos = this.getLocalVideoMetadata();
    return videos.find(v => v.id === id) || null;
  }

  private removeVideoMetadata(id: string): void {
    const videos = this.getLocalVideoMetadata();
    const filteredVideos = videos.filter(v => v.id !== id);
    localStorage.setItem('firebase_videos_metadata', JSON.stringify(filteredVideos));
  }

  private getLocalVideoMetadata(): VideoData[] {
    try {
      const data = localStorage.getItem('firebase_videos_metadata');
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error parsing video metadata:', error);
      return [];
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
}

// Export singleton instance
export const firebaseStorageService = new FirebaseStorageService();
export type { VideoData, StorageQuota }; 