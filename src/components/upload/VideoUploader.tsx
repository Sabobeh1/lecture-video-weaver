
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Upload, File, X, Check, Loader2, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { VideoPlayer } from "@/components/player/VideoPlayer";

interface VideoUploaderProps {
  loadingDelay?: number; // in seconds
  videoPath?: string;
}

interface SavedVideoData {
  fileName: string;
  videoPath: string;
  timestamp: number;
}

export function VideoUploader({ 
  loadingDelay = 10, 
  videoPath = "/videoplayback.mp4" // Path should be in public folder
}: VideoUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [savedVideoPath, setSavedVideoPath] = useState<string>(videoPath);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load saved video data from localStorage on component mount
  useEffect(() => {
    const savedData = localStorage.getItem("savedVideoData");
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData) as SavedVideoData;
        setSavedVideoPath(parsedData.videoPath);
        setIsVideoReady(true);
        setSelectedFile(new File([], parsedData.fileName));
      } catch (error) {
        console.error("Error parsing saved video data:", error);
        localStorage.removeItem("savedVideoData");
      }
    }
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
    // Start loading phase after upload completes
    setIsLoading(true);

    // Simulate processing delay
    setTimeout(() => {
      setIsLoading(false);
      
      // Save video information to localStorage
      const videoData: SavedVideoData = {
        fileName: file.name,
        videoPath: videoPath, // using the default video for this example
        timestamp: Date.now()
      };
      
      localStorage.setItem("savedVideoData", JSON.stringify(videoData));
      setSavedVideoPath(videoPath);
      setIsVideoReady(true);
      toast.success("Video processed and saved to local storage!");
    }, loadingDelay * 1000); // Convert seconds to milliseconds
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setUploadProgress(0);
    setIsUploading(false);
    setIsLoading(false);
    setIsVideoReady(false);
    setVideoError(null);
    setSavedVideoPath(videoPath);
    // Clear localStorage
    localStorage.removeItem("savedVideoData");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Test if video path is accessible
  useEffect(() => {
    if (isVideoReady) {
      const video = document.createElement('video');
      video.src = savedVideoPath;
      video.onloadeddata = () => {
        // Video exists and is loaded
        console.log("Video file loaded successfully");
      };
      video.onerror = () => {
        setVideoError("Could not load video. The file may not exist or is in an unsupported format.");
        toast.error("Error loading video file");
        setIsVideoReady(false);
      };
    }
  }, [isVideoReady, savedVideoPath]);

  return (
    <div className="w-full">
      {isVideoReady ? (
        <div className="space-y-4">
          <div className="flex justify-between">
            <h3 className="text-lg font-medium">{selectedFile?.name || "Saved Video"}</h3>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRemoveFile}
              >
                Upload Another File
              </Button>
            </div>
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
              src={savedVideoPath}
              title={selectedFile?.name || "Lecture Video"}
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
                <File size={24} className="text-primary" />
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
            accept=".pdf,.ppt,.pptx"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      )}
    </div>
  );
}
