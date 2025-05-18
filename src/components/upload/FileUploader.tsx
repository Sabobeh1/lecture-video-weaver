
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Upload, File, X, Check, Archive, RefreshCw, Info, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUploads } from "@/hooks/useUploads";
import { useNavigate } from "react-router-dom";
import { VideoUploader } from "@/components/upload/VideoUploader";

interface FileUploaderProps {
  onFileSelected?: (file: File) => void;
  maxSize?: number; // in MB
  allowedTypes?: string[];
}

export function FileUploader({ 
  onFileSelected, 
  maxSize = 100, 
  allowedTypes = [".pdf", ".pptx"]
}: FileUploaderProps) {
  const navigate = useNavigate();
  const { createUpload } = useUploads();
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [showVideoUploader, setShowVideoUploader] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const validateFile = (file: File): boolean => {
    // Check file size
    const fileSizeInMB = file.size / (1024 * 1024);
    if (fileSizeInMB > maxSize) {
      toast.error(`File size exceeds ${maxSize}MB limit`);
      return false;
    }

    // Check file type
    const fileExtension = `.${file.name.split('.').pop()?.toLowerCase()}`;
    if (allowedTypes.length > 0 && !allowedTypes.includes(fileExtension)) {
      toast.error(`File type not supported. Allowed types: ${allowedTypes.join(", ")}`);
      return false;
    }

    return true;
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
    
    if (onFileSelected) {
      onFileSelected(file);
    }
    
    simulateUpload(file);
  };

  const simulateUpload = (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          handleSubmitUpload(file);
          return 100;
        }
        return prev + 5;
      });
    }, 100);
  };

  const handleSubmitUpload = async (file: File) => {
    if (import.meta.env.DEV) {
      toast.info(
        <div className="flex flex-col gap-1">
          <div className="font-semibold flex items-center gap-1">
            <AlertTriangle size={16} className="text-amber-500" /> Development Mode Notice
          </div>
          <p className="text-sm">
            In development mode, SSH transfer is simulated. For production, set up a backend service to handle actual file transfers.
          </p>
        </div>,
        { duration: 8000 }
      );
    }

    const uploadId = await createUpload(file, file.name);
    if (uploadId) {
      setShowVideoUploader(true);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setUploadProgress(0);
    setIsUploading(false);
    setShowVideoUploader(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  if (showVideoUploader && selectedFile) {
    return (
      <div className="space-y-4">
        <VideoUploader 
          loadingDelay={12}
          file={selectedFile}
        />
      </div>
    );
  }

  return (
    <div className="w-full">
      {selectedFile ? (
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
          
          {uploadProgress === 100 && (
            <div className="flex items-center gap-2 text-blue-600 mt-1 text-sm">
              <Archive size={16} />
              <span>Transferring to SSH server...</span>
            </div>
          )}

          {import.meta.env.DEV && (
            <div className="bg-amber-50 border border-amber-200 p-2 rounded mt-3 text-xs text-amber-700">
              <div className="flex items-start">
                <Info size={14} className="mt-0.5 mr-1 flex-shrink-0" />
                <span>
                  <strong>Development Mode:</strong> SSH transfers are simulated. For actual transfers, implement a backend API service that handles SSH connections.
                </span>
              </div>
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
          <h3 className="text-lg font-medium mb-1">Upload Slides</h3>
          <p className="text-sm text-gray-500 text-center mb-4">
            Drag & drop your slides here or click to browse
          </p>
          <p className="text-xs text-gray-400">
            Supported formats: {allowedTypes.join(", ")} (max {maxSize}MB)
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept={allowedTypes.join(",")}
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      )}
    </div>
  );
}
