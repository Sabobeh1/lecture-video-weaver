import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useLoadingSpinner } from "@/hooks/useLoadingSpinner";
import { toast } from "sonner";
import { Upload, File as FileIcon, X, Check, AlertTriangle, HardDrive } from "lucide-react";
import { cn } from "@/lib/utils";
import { VideoPlayer } from "@/components/player/VideoPlayer";
import { videoStorageService, VideoData, StorageQuota } from "@/services/videoStorageService";

interface VideoUploaderProps {
  loadingDelay?: number; // in seconds
  file?: File;
}

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB in bytes
const AI_SERVICE_URL = "http://176.119.254.185:7111/generate-video";

export function VideoUploader({ loadingDelay = 10, file }: VideoUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(file || null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);
  const [storageQuota, setStorageQuota] = useState<StorageQuota | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Enhanced loading spinner hook
  const {
    isLoading,
    error: loadingError,
    message: loadingMessage,
    startLoading,
    stopLoading,
    setError: setLoadingError,
    clearError: clearLoadingError,
    cancel: cancelLoading,
    updateMessage,
    withLoading
  } = useLoadingSpinner({
    defaultMessage: "Generating your video via AI...",
    onCancel: () => {
      // Abort any ongoing upload
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      handleRemoveFile();
    }
  });

  useEffect(() => {
    if (file) {
      processFile(file);
    }
  }, [file]);

  // Initialize storage and load saved video on component mount
  useEffect(() => {
    const initializeStorage = async () => {
      try {
        // Request storage quota increase
        await videoStorageService.requestStorageQuota();
        
        // Get current quota information
        const quota = await videoStorageService.getStorageQuota();
        setStorageQuota(quota);
        
        // Migrate any existing localStorage data
        await videoStorageService.migrateFromLocalStorage();
        
        // Load most recent video
        const savedVideo = await videoStorageService.loadMostRecentVideo();
        if (savedVideo) {
          const objectUrl = URL.createObjectURL(savedVideo.videoBlob);
          setVideoUrl(objectUrl);
          setSelectedFile(new File([savedVideo.videoBlob], savedVideo.fileName, { type: 'video/mp4' }));
          setCurrentVideoId(savedVideo.id);
          setIsVideoReady(true);
          
          console.log(`Loaded saved video: ${savedVideo.fileName} (${formatFileSize(savedVideo.fileSize)})`);
        }
      } catch (error) {
        console.error("Error initializing video storage:", error);
        toast.error("Failed to initialize video storage");
      }
    };

    initializeStorage();
  }, []);

  // Clean up object URLs when component unmounts
  useEffect(() => {
    return () => {
      if (videoUrl && videoUrl.startsWith('blob:')) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [videoUrl]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFile = (file: File): boolean => {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`File size exceeds 20MB limit`);
      return false;
    }

    // Check file type
    if (file.type !== 'application/pdf') {
      toast.error('Only PDF files are supported');
      return false;
    }

    return true;
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const processFile = (file: File) => {
    if (!validateFile(file)) return;
    setSelectedFile(file);
    uploadToAIService(file);
  };

  const uploadToAIService = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);
    setIsVideoReady(false);
    clearLoadingError();

    try {
      await withLoading(async (signal) => {
        // Create new AbortController for this upload
        abortControllerRef.current = new AbortController();
        
        updateMessage("Preparing your PDF for processing...");
        console.log("Uploading to AI service...");
        
        const formData = new FormData();
        formData.append('file', file);

        updateMessage("Uploading to AI service...");
        
        const response = await fetch(AI_SERVICE_URL, {
          method: 'POST',
          body: formData,
          signal: abortControllerRef.current.signal,
        });

        console.log("AI Service Response:", response);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        updateMessage("Processing AI response...");
        
        // Get the video blob from the response
        const videoBlob = await response.blob();
        
        updateMessage("Checking storage space...");
        
        // Check storage space before saving
        const { sufficient, quota } = await videoStorageService.checkStorageSpace(videoBlob.size);
        setStorageQuota(quota);
        
        if (!sufficient) {
          const errorMsg = `Insufficient storage space. Video size: ${formatFileSize(videoBlob.size)}, Available: ${formatFileSize(quota.available)}`;
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
          throw new Error(errorMsg);
        }
        
        updateMessage("Saving video...");
        
        // Save video to IndexedDB
        try {
          const videoId = await videoStorageService.saveVideo(file.name, videoBlob);
          setCurrentVideoId(videoId);
          
          // Create object URL for immediate playback
          const videoObjectUrl = URL.createObjectURL(videoBlob);
          setVideoUrl(videoObjectUrl);
          setIsVideoReady(true);
          
          // Update quota display
          const updatedQuota = await videoStorageService.getStorageQuota();
          setStorageQuota(updatedQuota);
          
          toast.success(
            <div className="space-y-1">
              <div className="font-semibold">Video generated successfully!</div>
              <div className="text-sm">Saved: {formatFileSize(videoBlob.size)}</div>
            </div>
          );
        } catch (storageError) {
          console.error("Error saving video to storage:", storageError);
          toast.error("Video generated but failed to save locally");
          
          // Still allow playback even if storage fails
          const videoObjectUrl = URL.createObjectURL(videoBlob);
          setVideoUrl(videoObjectUrl);
          setIsVideoReady(true);
        }
        
        return videoBlob;
      }, "Starting video generation...");
      
    } catch (error: any) {
      if (error.name === 'AbortError') {
        toast.info("Video generation cancelled");
      } else {
        console.error("Error generating video:", error);
        toast.error("Error generating video");
      }
    } finally {
      setIsUploading(false);
      setUploadProgress(100);
    }
  };

  const handleRemoveFile = async () => {
    // Cancel any ongoing loading operation
    cancelLoading();
    
    // Abort any ongoing upload
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // Clean up video URL
    if (videoUrl && videoUrl.startsWith('blob:')) {
      URL.revokeObjectURL(videoUrl);
    }
    
    // Remove from IndexedDB storage
    if (currentVideoId) {
      try {
        await videoStorageService.deleteVideo(currentVideoId);
        // Update quota display
        const updatedQuota = await videoStorageService.getStorageQuota();
        setStorageQuota(updatedQuota);
      } catch (error) {
        console.error("Error removing video from storage:", error);
      }
    }
    
    setSelectedFile(null);
    setVideoUrl(null);
    setCurrentVideoId(null);
    setUploadProgress(0);
    setIsUploading(false);
    setIsVideoReady(false);
    clearLoadingError();
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    
    toast.info("Video removed");
  };

  const handleRetryGeneration = () => {
    if (selectedFile) {
      clearLoadingError();
      uploadToAIService(selectedFile);
    }
  };

  // Storage quota display component
  const StorageQuotaDisplay = ({ quota }: { quota: StorageQuota }) => {
    const usagePercentage = quota.quota > 0 ? (quota.usage / quota.quota) * 100 : 0;
    const isHighUsage = usagePercentage > 80;
    
    return (
      <Card className="p-3 bg-gray-50">
        <div className="flex items-center gap-2 mb-2">
          <HardDrive size={16} className="text-gray-600" />
          <span className="text-sm font-medium">Storage Usage</span>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-600">
            <span>{formatFileSize(quota.usage)} used</span>
            <span>{formatFileSize(quota.available)} available</span>
          </div>
          <Progress 
            value={usagePercentage} 
            className={cn("h-2", isHighUsage && "bg-red-100")}
          />
          {quota.quota > 0 && (
            <div className="text-xs text-gray-500 text-center">
              Total: {formatFileSize(quota.quota)}
            </div>
          )}
        </div>
      </Card>
    );
  };

  return (
    <div className="w-full space-y-4">
      {/* Storage quota display */}
      {storageQuota && <StorageQuotaDisplay quota={storageQuota} />}
      
      {isVideoReady && videoUrl ? (
        <div className="space-y-4">
          <div className="flex justify-between">
            <h3 className="text-lg font-medium">{selectedFile?.name}</h3>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRemoveFile}
            >
              Upload Another File
            </Button>
          </div>
          
          <VideoPlayer 
            src={videoUrl}
            title={selectedFile?.name || "Generated Video"}
            allowDownload={true}
          />
        </div>
      ) : selectedFile ? (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="bg-primary-100 p-2 rounded">
                <FileIcon size={24} className="text-primary" />
              </div>
              <div>
                <p className="font-medium line-clamp-1">{selectedFile.name}</p>
                <p className="text-sm text-gray-500">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              disabled={isUploading || isLoading}
              onClick={handleRemoveFile}
            >
              <X size={20} className="text-gray-500" />
            </Button>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span>{isUploading || isLoading ? "Generating video..." : "Ready to generate"}</span>
              <span>{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="h-2" />
          </div>
          
          {uploadProgress === 100 && !isVideoReady && !loadingError && !isLoading && (
            <div className="flex items-center gap-2 text-green-600 mt-3 text-sm">
              <Check size={16} />
              <span>Processing complete</span>
            </div>
          )}
        </Card>
      ) : (
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-all",
            isDragging ? "border-primary bg-primary-50" : "border-gray-300 hover:border-primary",
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="bg-gray-100 p-3 rounded-full mb-4">
            <Upload size={24} className="text-gray-500" />
          </div>
          <h3 className="text-lg font-medium mb-1">Upload PDF to Generate Video</h3>
          <p className="text-sm text-gray-500 text-center mb-4">
            Drag & drop your PDF here or click to browse
          </p>
          <p className="text-xs text-gray-400">
            Supported format: PDF (max 20MB)
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      )}

      {/* Enhanced Loading Spinner */}
      {isLoading && (
        <LoadingSpinner 
          message={loadingMessage}
          showCancel={true}
          onCancel={cancelLoading}
        />
      )}

      {/* Enhanced Error Display */}
      {loadingError && !isLoading && (
        <LoadingSpinner 
          isError={true}
          error={loadingError}
          showRetry={true}
          onRetry={handleRetryGeneration}
        />
      )}
    </div>
  );
}
