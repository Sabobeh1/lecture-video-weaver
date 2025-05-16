import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Upload, File as FileIcon, X, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { VideoPlayer } from "@/components/player/VideoPlayer";

interface VideoUploaderProps {
  loadingDelay?: number; // in seconds
  videoPath?: string;
}

interface SavedVideoData {
  fileName: string;
  fileSize: number;
  lastModified?: number;
}

const LOCAL_STORAGE_KEY = "saved_preview_video";

export function VideoUploader({ 
  loadingDelay = 10, 
  videoPath = "/attach/videoplayback.mp4" // Updated default path
}: VideoUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [savedVideoData, setSavedVideoData] = useState<SavedVideoData | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>(videoPath);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);

  // Load saved video data on component mount
  useEffect(() => {
    try {
      // First try to load metadata from localStorage
      const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
      const savedVideoBlob = localStorage.getItem(`${LOCAL_STORAGE_KEY}_blob`);
      
      if (savedData) {
        const parsedData = JSON.parse(savedData) as SavedVideoData;
        setSavedVideoData(parsedData);
        
        // If we have a blob in localStorage, use it
        if (savedVideoBlob) {
          try {
            // Convert base64 to blob
            const byteCharacters = atob(savedVideoBlob);
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
            const newObjectUrl = URL.createObjectURL(blob);
            objectUrlRef.current = newObjectUrl;
            setVideoUrl(newObjectUrl);
            setIsVideoReady(true);
          } catch (error) {
            console.error("Error converting saved blob:", error);
            setVideoUrl(videoPath);
          }
        } else {
          // Fall back to default video if blob isn't available
          setVideoUrl(videoPath);
          setIsVideoReady(true);
        }
      }
    } catch (error) {
      console.error("Error parsing saved video data:", error);
      setVideoError("Could not load saved video. Please upload a new one.");
    }
  }, [videoPath]);

  // Clean up object URLs when component unmounts
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

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
    setSelectedFile(file);
    simulateUpload(file);
  };

  const simulateUpload = (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);
    setIsVideoReady(false);
    setVideoError(null);

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          handleUploadComplete(file);
          return 100;
        }
        return prev + 5;
      });
    }, 100);
  };

  const handleUploadComplete = (file: File) => {
    try {
      // Create object URL for video playback
      const objectUrl = URL.createObjectURL(file);
      
      // Store the previous objectURL to revoke it
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
      
      // Update the current objectURL reference
      objectUrlRef.current = objectUrl;
      
      // Set the video URL to the object URL
      setVideoUrl(objectUrl);

      // Save file metadata to local storage
      const videoData: SavedVideoData = {
        fileName: file.name,
        fileSize: file.size,
        lastModified: file.lastModified
      };
      
      // Save metadata
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(videoData));
      setSavedVideoData(videoData);
      
      // Save blob as base64 string for persistence across sessions
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = () => {
        const base64data = reader.result as string;
        // Remove the data URL prefix and store only the base64 part
        const base64Content = base64data.split(',')[1];
        localStorage.setItem(`${LOCAL_STORAGE_KEY}_blob`, base64Content);
      };
      
      // Start loading phase after upload completes
      setIsLoading(true);

      // Simulate processing delay
      setTimeout(() => {
        setIsLoading(false);
        setIsVideoReady(true);
        toast.success("Video uploaded successfully!");
      }, loadingDelay * 1000); // Convert seconds to milliseconds
      
    } catch (error) {
      console.error("Error processing video:", error);
      setVideoError("Could not process video file. The file may be corrupted or in an unsupported format.");
      toast.error("Error loading video file");
    }
  };

  const handleRemoveFile = () => {
    // Revoke the object URL if it exists
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    
    setSelectedFile(null);
    setSavedVideoData(null);
    setUploadProgress(0);
    setIsUploading(false);
    setIsLoading(false);
    setIsVideoReady(false);
    setVideoError(null);
    setVideoUrl(videoPath); // Reset to default video path
    
    // Clear local storage
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_blob`);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    
    toast.info("Video removed");
  };

  return (
    <div className="w-full">
      {isVideoReady ? (
        <div className="space-y-4">
          <div className="flex justify-between">
            <h3 className="text-lg font-medium">{selectedFile?.name || savedVideoData?.fileName}</h3>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRemoveFile}
            >
              Upload Another File
            </Button>
          </div>
          
          {videoError ? (
            <Card className="p-8 text-center">
              <div className="text-red-500 mb-4">
                <X size={48} className="mx-auto" />
              </div>
              <p className="text-gray-800 font-medium mb-2">Video Error</p>
              <p className="text-gray-600">{videoError}</p>
              <Button 
                variant="outline" 
                className="mt-4" 
                onClick={handleRemoveFile}
              >
                Try Again
              </Button>
            </Card>
          ) : (
            <VideoPlayer 
              src={videoUrl}
              title={selectedFile?.name || savedVideoData?.fileName || "Lecture Video"}
              allowDownload={false}
            />
          )}
        </div>
      ) : isLoading ? (
        <Card className="p-8 flex flex-col items-center justify-center min-h-[300px]">
          <Loader2 size={48} className="text-primary animate-spin mb-4" />
          <p className="text-lg font-medium mb-2">Processing your slides...</p>
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
              <span>{isUploading ? "Uploading..." : "Upload complete"}</span>
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
          <h3 className="text-lg font-medium mb-1">Upload Slide Lectures</h3>
          <p className="text-sm text-gray-500 text-center mb-4">
            Drag & drop your slides here or click to browse
          </p>
          <p className="text-xs text-gray-400">
            Supported formats: .pdf, .ppt, .pptx
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*,.pdf,.ppt,.pptx"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      )}
    </div>
  );
}
