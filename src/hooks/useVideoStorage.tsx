import { useState, useEffect, useCallback } from 'react';
import { videoStorageService, VideoData, StorageQuota } from '@/services/videoStorageService';
import { toast } from 'sonner';

export const useVideoStorage = () => {
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [storageQuota, setStorageQuota] = useState<StorageQuota | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize storage and load data
  const initializeStorage = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Request storage quota increase
      await videoStorageService.requestStorageQuota();
      
      // Get current quota information
      const quota = await videoStorageService.getStorageQuota();
      setStorageQuota(quota);
      
      // Migrate any existing localStorage data
      await videoStorageService.migrateFromLocalStorage();
      
      // Load all videos
      const allVideos = await videoStorageService.getAllVideos();
      setVideos(allVideos);
      
      console.log(`Loaded ${allVideos.length} videos from storage`);
    } catch (err) {
      console.error('Error initializing video storage:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize storage');
      toast.error('Failed to initialize video storage');
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh storage quota
  const refreshQuota = useCallback(async () => {
    try {
      const quota = await videoStorageService.getStorageQuota();
      setStorageQuota(quota);
    } catch (err) {
      console.error('Error refreshing storage quota:', err);
    }
  }, []);

  // Save a new video
  const saveVideo = useCallback(async (
    fileName: string, 
    videoBlob: Blob, 
    thumbnailUrl?: string
  ): Promise<string | null> => {
    try {
      // Check storage space before saving
      const { sufficient, quota } = await videoStorageService.checkStorageSpace(videoBlob.size);
      
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
      
      // Save the video
      const videoId = await videoStorageService.saveVideo(fileName, videoBlob, thumbnailUrl);
      
      // Refresh videos list and quota
      await refreshData();
      
      return videoId;
    } catch (err) {
      console.error('Error saving video:', err);
      toast.error('Failed to save video');
      return null;
    }
  }, []);

  // Load a specific video
  const loadVideo = useCallback(async (id: string): Promise<VideoData | null> => {
    try {
      return await videoStorageService.loadVideo(id);
    } catch (err) {
      console.error('Error loading video:', err);
      toast.error('Failed to load video');
      return null;
    }
  }, []);

  // Delete a video
  const deleteVideo = useCallback(async (id: string): Promise<boolean> => {
    try {
      const success = await videoStorageService.deleteVideo(id);
      if (success) {
        // Refresh videos list and quota
        await refreshData();
        toast.success('Video deleted successfully');
      }
      return success;
    } catch (err) {
      console.error('Error deleting video:', err);
      toast.error('Failed to delete video');
      return false;
    }
  }, []);

  // Clear all videos
  const clearAllVideos = useCallback(async (): Promise<boolean> => {
    try {
      const success = await videoStorageService.clearAllVideos();
      if (success) {
        setVideos([]);
        await refreshQuota();
        toast.success('All videos cleared successfully');
      }
      return success;
    } catch (err) {
      console.error('Error clearing videos:', err);
      toast.error('Failed to clear videos');
      return false;
    }
  }, [refreshQuota]);

  // Refresh both videos and quota
  const refreshData = useCallback(async () => {
    try {
      const [allVideos, quota] = await Promise.all([
        videoStorageService.getAllVideos(),
        videoStorageService.getStorageQuota()
      ]);
      
      setVideos(allVideos);
      setStorageQuota(quota);
    } catch (err) {
      console.error('Error refreshing video storage data:', err);
    }
  }, []);

  // Get most recent video
  const getMostRecentVideo = useCallback(async (): Promise<VideoData | null> => {
    try {
      return await videoStorageService.loadMostRecentVideo();
    } catch (err) {
      console.error('Error loading most recent video:', err);
      return null;
    }
  }, []);

  // Check if storage has sufficient space for a video
  const checkStorageSpace = useCallback(async (videoSize: number) => {
    try {
      return await videoStorageService.checkStorageSpace(videoSize);
    } catch (err) {
      console.error('Error checking storage space:', err);
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