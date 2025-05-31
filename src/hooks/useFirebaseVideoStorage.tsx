import { useState, useEffect, useCallback } from 'react';
import { firebaseStorageService, VideoData, StorageQuota } from '@/services/firebaseStorageService';
import { toast } from 'sonner';

export const useFirebaseVideoStorage = () => {
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [storageQuota, setStorageQuota] = useState<StorageQuota | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize storage and load data
  const initializeStorage = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Request storage quota increase (Firebase handles this automatically)
      await firebaseStorageService.requestStorageQuota();
      
      // Get current quota information
      const quota = await firebaseStorageService.getStorageQuota();
      setStorageQuota(quota);
      
      // Migrate any existing localStorage data (for compatibility)
      await firebaseStorageService.migrateFromLocalStorage();
      
      // Load all videos from Firebase Storage
      const allVideos = await firebaseStorageService.getAllVideos();
      setVideos(allVideos);
      
      console.log(`Loaded ${allVideos.length} videos from Firebase Storage`);
    } catch (err) {
      console.error('Error initializing Firebase video storage:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize Firebase storage');
      toast.error('Failed to initialize Firebase video storage');
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh storage quota
  const refreshQuota = useCallback(async () => {
    try {
      const quota = await firebaseStorageService.getStorageQuota();
      setStorageQuota(quota);
    } catch (err) {
      console.error('Error refreshing storage quota:', err);
    }
  }, []);

  // Save a new video - Note: This hook is mainly for display/management
  // Video uploads are handled by the backend, this is for metadata management
  const saveVideo = useCallback(async (
    fileName: string, 
    videoBlob: Blob, 
    thumbnailUrl?: string
  ): Promise<string | null> => {
    try {
      // Check storage space before saving (Firebase typically has large limits)
      const { sufficient, quota } = await firebaseStorageService.checkStorageSpace(videoBlob.size);
      
      if (!sufficient) {
        const formatFileSize = (bytes: number): string => {
          if (bytes === 0) return '0 Bytes';
          const k = 1024;
          const sizes = ['Bytes', 'KB', 'MB', 'GB'];
          const i = Math.floor(Math.log(bytes) / Math.log(k));
          return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        };

        toast.error(
          <div className="space-y-2">
            <div className="font-semibold">Insufficient Storage Space</div>
            <div className="text-sm">
              Video size: {formatFileSize(videoBlob.size)}<br/>
              Available: {formatFileSize(quota.available)}<br/>
              Total quota: {formatFileSize(quota.quota)}
            </div>
          </div>,
          { duration: 10000 }
        );
        return null;
      }
      
      // Save the video to Firebase Storage
      const videoId = await firebaseStorageService.saveVideo(fileName, videoBlob, thumbnailUrl);
      
      // Refresh videos list and quota
      await refreshData();
      
      toast.success('Video saved to Firebase Storage successfully!');
      return videoId;
    } catch (err) {
      console.error('Error saving video to Firebase:', err);
      toast.error('Failed to save video to Firebase Storage');
      return null;
    }
  }, []);

  // Load a specific video
  const loadVideo = useCallback(async (id: string): Promise<VideoData | null> => {
    try {
      return await firebaseStorageService.loadVideo(id);
    } catch (err) {
      console.error('Error loading video from Firebase:', err);
      toast.error('Failed to load video from Firebase Storage');
      return null;
    }
  }, []);

  // Delete a video
  const deleteVideo = useCallback(async (id: string): Promise<boolean> => {
    try {
      const success = await firebaseStorageService.deleteVideo(id);
      if (success) {
        // Refresh videos list and quota
        await refreshData();
        toast.success('Video deleted from Firebase Storage successfully');
      }
      return success;
    } catch (err) {
      console.error('Error deleting video from Firebase:', err);
      toast.error('Failed to delete video from Firebase Storage');
      return false;
    }
  }, []);

  // Clear all videos
  const clearAllVideos = useCallback(async (): Promise<boolean> => {
    try {
      const success = await firebaseStorageService.clearAllVideos();
      if (success) {
        setVideos([]);
        await refreshQuota();
        toast.success('All videos cleared from Firebase Storage successfully');
      }
      return success;
    } catch (err) {
      console.error('Error clearing videos from Firebase:', err);
      toast.error('Failed to clear videos from Firebase Storage');
      return false;
    }
  }, [refreshQuota]);

  // Refresh both videos and quota
  const refreshData = useCallback(async () => {
    try {
      const [allVideos, quota] = await Promise.all([
        firebaseStorageService.getAllVideos(),
        firebaseStorageService.getStorageQuota()
      ]);
      
      setVideos(allVideos);
      setStorageQuota(quota);
    } catch (err) {
      console.error('Error refreshing Firebase video storage data:', err);
    }
  }, []);

  // Get most recent video
  const getMostRecentVideo = useCallback(async (): Promise<VideoData | null> => {
    try {
      return await firebaseStorageService.loadMostRecentVideo();
    } catch (err) {
      console.error('Error loading most recent video from Firebase:', err);
      return null;
    }
  }, []);

  // Check if storage has sufficient space for a video
  const checkStorageSpace = useCallback(async (videoSize: number) => {
    try {
      return await firebaseStorageService.checkStorageSpace(videoSize);
    } catch (err) {
      console.error('Error checking Firebase storage space:', err);
      return { sufficient: false, quota: storageQuota || { quota: 0, usage: 0, available: 0 } };
    }
  }, [storageQuota]);

  // Format file size utility
  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  // Initialize on mount
  useEffect(() => {
    initializeStorage();
  }, [initializeStorage]);

  return {
    // State
    videos,
    storageQuota,
    loading,
    error,
    
    // Actions
    saveVideo,
    loadVideo,
    deleteVideo,
    clearAllVideos,
    getMostRecentVideo,
    refreshQuota,
    refreshData,
    checkStorageSpace,
    initializeStorage,
    
    // Utils
    formatFileSize,
    
    // Computed values
    videoCount: videos.length,
    totalStorageUsed: videos.reduce((total, video) => total + video.fileSize, 0),
  };
}; 