
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Upload, File as FileIcon, X, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { VideoPlayer } from "@/components/player/VideoPlayer";
import { generateVideo, saveVideoToLocalStorage, blobToBase64, generateId } from "@/services/videoService";

interface VideoUploaderProps {
  loadingDelay?: number;
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
  videoPath = "/videoplayback.mp4"
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
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load saved video data on component mount
  useEffect(() => {
    try {
      const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
      const savedVideoBlob = localStorage.getItem(`${LOCAL_STORAGE_KEY}_blob`);
      
      if (savedData) {
        const parsedData = JSON.parse(savedData) as SavedVideoData;
        setSavedVideoData(parsedData);
        
        if (savedVideoBlob) {
          try {
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
      
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
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
    // Validate file size (20MB max)
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > 20) {
      toast.error("File is too large. Maximum size is 20MB.");
      return;
    }
    
    // Validate file type
    if (file.type !== 'application/pdf') {
      toast.error("Only PDF files are allowed.");
      return;
    }
    
    setSelectedFile(file);
    handleVideoGeneration(file);
  };

  const handleVideoGeneration = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);
    setIsVideoReady(false);
    setVideoError(null);
    setIsGeneratingVideo(true);
    
    try {
      // Create a progress interval to show some feedback
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          // Max at 95% until we actually get the video
          if (prev >= 95) {
            return 95;
          }
          return prev + 1;
        });
      }, 500);
      
      // Upload PDF and generate video
      const videoBlob = await generateVideo(file);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      if (videoBlob) {
        await handleUploadComplete(file, videoBlob);
      } else {
        throw new Error("Failed to generate video");
      }
    } catch (error) {
      console.error("Video generation error:", error);
      setVideoError("Failed to generate video. Please try again.");
      setIsUploading(false);
      setIsGeneratingVideo(false);
      toast.error("Failed to generate video");
    }
  };

  const handleUploadComplete = async (file: File, videoBlob: Blob) => {
    try {
      // Create object URL for video playback
      const objectUrl = URL.createObjectURL(videoBlob);
      
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
      
      // Convert blob to base64 and save
      const base64data = await blobToBase64(videoBlob);
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_blob`, base64data);
      
      // Save to videos collection for Dashboard/My Videos
      const videoId = generateId();
      saveVideoToLocalStorage({
        id: videoId,
        title: file.name.replace('.pdf', ''),
        fileSize: file.size,
        createdAt: new Date().toISOString(),
        videoBlob: base64data,
        status: "completed"
      });
      
      // Finish the upload process
      setIsUploading(false);
      setIsGeneratingVideo(false);
      setIsVideoReady(true);
      toast.success("Video generated successfully!");
      
    } catch (error) {
      console.error("Error processing video:", error);
      setVideoError("Could not process video file. The file may be corrupted or in an unsupported format.");
      setIsUploading(false);
      setIsGeneratingVideo(false);
      toast.error("Error loading video file");
    }
  };

  const handleRemoveFile = () => {
    // Revoke the object URL if it exists
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    
    // Abort any ongoing requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    setSelectedFile(null);
    setSavedVideoData(null);
    setUploadProgress(0);
    setIsUploading(false);
    setIsGeneratingVideo(false);
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

  const cancelGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    setIsUploading(false);
    setIsGeneratingVideo(false);
    setUploadProgress(0);
    toast.info("Video generation cancelled");
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
      ) : isGeneratingVideo ? (
        <Card className="p-8 flex flex-col items-center justify-center min-h-[300px]">
          <Loader2 size={48} className="text-primary animate-spin mb-4" />
          <p className="text-lg font-medium mb-2">Generating your video via AI...</p>
          <p className="text-gray-500 mb-4">This may take up to a minute</p>
          
          <div className="w-full max-w-md space-y-2 mb-4">
            <div className="flex justify-between items-center text-sm">
              <span>Processing...</span>
              <span>{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="h-2" />
          </div>
          
          <Button variant="outline" onClick={cancelGeneration}>Cancel</Button>
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
          <h3 className="text-lg font-medium mb-1">Upload PDF Slides</h3>
          <p className="text-sm text-gray-500 text-center mb-4">
            Drag & drop your PDF here or click to browse
          </p>
          <p className="text-xs text-gray-400">
            Maximum file size: 20MB
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
    </div>
  );
}
