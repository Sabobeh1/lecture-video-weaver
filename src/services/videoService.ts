
import { toast } from "sonner";

const API_URL = "http://176.119.254.185:7111/generate-video";
const LOCAL_STORAGE_VIDEOS_KEY = "saved_videos";

export interface VideoData {
  id: string;
  title: string;
  fileSize?: number;
  createdAt: string;
  videoBlob?: string; // Base64 encoded video
  status: "pending" | "processing" | "completed" | "error";
  errorMessage?: string;
}

export const generateVideo = async (
  file: File,
  onProgress?: (progress: number) => void
): Promise<Blob | null> => {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(API_URL, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Error: ${response.status}`);
    }

    // The response should be the video blob
    const videoBlob = await response.blob();
    return videoBlob;
  } catch (error) {
    console.error("Error generating video:", error);
    toast.error(error instanceof Error ? error.message : "Error generating video");
    return null;
  }
};

export const saveVideoToLocalStorage = (videoData: VideoData): string => {
  try {
    // Get existing videos
    const existingVideosJSON = localStorage.getItem(LOCAL_STORAGE_VIDEOS_KEY);
    const existingVideos: VideoData[] = existingVideosJSON ? JSON.parse(existingVideosJSON) : [];
    
    // Add new video data
    const updatedVideos = [videoData, ...existingVideos];
    
    // Save back to localStorage
    localStorage.setItem(LOCAL_STORAGE_VIDEOS_KEY, JSON.stringify(updatedVideos));
    
    return videoData.id;
  } catch (error) {
    console.error("Error saving video to localStorage:", error);
    toast.error("Failed to save video data");
    return "";
  }
};

export const getVideosFromLocalStorage = (): VideoData[] => {
  try {
    const videosJSON = localStorage.getItem(LOCAL_STORAGE_VIDEOS_KEY);
    return videosJSON ? JSON.parse(videosJSON) : [];
  } catch (error) {
    console.error("Error getting videos from localStorage:", error);
    toast.error("Failed to load saved videos");
    return [];
  }
};

export const updateVideoInLocalStorage = (id: string, updates: Partial<VideoData>): boolean => {
  try {
    const videos = getVideosFromLocalStorage();
    const videoIndex = videos.findIndex(v => v.id === id);
    
    if (videoIndex === -1) return false;
    
    videos[videoIndex] = { ...videos[videoIndex], ...updates };
    localStorage.setItem(LOCAL_STORAGE_VIDEOS_KEY, JSON.stringify(videos));
    return true;
  } catch (error) {
    console.error("Error updating video in localStorage:", error);
    return false;
  }
};

// Helper function to convert blob to base64
export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(",")[1];
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};
