import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Upload, File as FileIcon, X, Check, Loader2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { VideoPlayer } from "@/components/player/VideoPlayer";

interface VideoUploaderProps {
  loadingDelay?: number; // in seconds
  file?: File;
}

interface SavedVideoData {
  fileName: string;
  fileSize: number;
  videoBlob: string; // Base64 encoded video
  timestamp: number;
}

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB in bytes
const AI_SERVICE_URL = "http://176.119.254.185:7111/generate-video";
const STORAGE_KEY = "saved_video_data";

export function VideoUploader({ loadingDelay = 10, file }: VideoUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(file || null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (file) {
      processFile(file);
    }
  }, [file]);

  // Load saved video on component mount
  useEffect(() => {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData) {
        const { fileName, videoBlob } = JSON.parse(savedData) as SavedVideoData;
        
        // Convert base64 to blob
        const byteCharacters = atob(videoBlob);
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
        const objectUrl = URL.createObjectURL(blob);
        
        setVideoUrl(objectUrl);
        setSelectedFile(new File([blob], fileName, { type: 'video/mp4' }));
        setIsVideoReady(true);
      }
    } catch (error) {
      console.error("Error loading saved video:", error);
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  // Clean up object URLs when component unmounts
  useEffect(() => {
    return () => {
      if (videoUrl && videoUrl.startsWith('blob:')) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [videoUrl]);

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
    console.log("hello a");
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const processFile = (file: File) => {
    console.log("hello b");

    if (!validateFile(file)) return;
    console.log("hello c");
    setSelectedFile(file);
    uploadToAIService(file);
  };

  const uploadToAIService = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);
    setIsVideoReady(false);
    setVideoError(null);

    // Create new AbortController for this upload
    abortControllerRef.current = new AbortController();

    try {
      const formData = new FormData();
      formData.append('file', file);

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

      // Get the video blob from the response
      const videoBlob = await response.blob();
      
      // Convert blob to base64 for storage
      const reader = new FileReader();
      reader.readAsDataURL(videoBlob);
      
      reader.onloadend = () => {
        const base64data = reader.result as string;
        // Remove the data URL prefix and store only the base64 part
        const base64Content = base64data.split(',')[1];
        
        // Save to localStorage
        const videoData: SavedVideoData = {
          fileName: file.name,
          fileSize: videoBlob.size,
          videoBlob: base64Content,
          timestamp: Date.now()
        };
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(videoData));
        
        // Create object URL for immediate playback
        const videoObjectUrl = URL.createObjectURL(videoBlob);
        setVideoUrl(videoObjectUrl);
        setIsVideoReady(true);
        toast.success("Video generated successfully!");
      };
      
    } catch (error: any) {
      if (error.name === 'AbortError') {
        toast.info("Upload cancelled");
      } else {
        console.error("Error generating video:", error);
        setVideoError(error.message || "Failed to generate video");
        toast.error("Error generating video");
      }
    } finally {
      setIsUploading(false);
      setUploadProgress(100);
    }
  };

  const handleRemoveFile = () => {
    // Abort any ongoing upload
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // Clean up video URL
    if (videoUrl && videoUrl.startsWith('blob:')) {
      URL.revokeObjectURL(videoUrl);
    }
    
    // Remove from localStorage
    localStorage.removeItem(STORAGE_KEY);
    
    setSelectedFile(null);
    setVideoUrl(null);
    setUploadProgress(0);
    setIsUploading(false);
    setIsLoading(false);
    setIsVideoReady(false);
    setVideoError(null);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    
    toast.info("Video removed");
  };

  return (
    <div className="w-full">
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
      ) : isLoading ? (
        <Card className="p-8 flex flex-col items-center justify-center min-h-[300px]">
          <Loader2 size={48} className="text-primary animate-spin mb-4" />
          <p className="text-lg font-medium mb-2">Generating your video via AI...</p>
          <p className="text-gray-500 mb-4">This may take a few moments</p>
          <Button variant="outline" onClick={handleRemoveFile}>Cancel</Button>
        </Card>
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
              disabled={isUploading}
              onClick={handleRemoveFile}
            >
              <X size={20} className="text-gray-500" />
            </Button>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span>{isUploading ? "Generating video..." : "Upload complete"}</span>
              <span>{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="h-2" />
          </div>
          
          {uploadProgress === 100 && (
            <div className="flex items-center gap-2 text-green-600 mt-3 text-sm">
              <Check size={16} />
              <span>Upload complete</span>
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

      {videoError && (
        <Card className="p-4 mt-4 border-red-200 bg-red-50">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="text-red-500 mt-0.5" />
            <div>
              <p className="font-medium text-red-700">Error Generating Video</p>
              <p className="text-sm text-red-600 mt-1">{videoError}</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-3"
                onClick={() => selectedFile && uploadToAIService(selectedFile)}
              >
                Try Again
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
