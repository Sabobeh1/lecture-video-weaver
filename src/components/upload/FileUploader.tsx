
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Upload, File, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUploads } from "@/hooks/useUploads";
import { useNavigate } from "react-router-dom";
import { uploadFile } from "@/services/uploadService";

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
    
    handleUpload(file);
  };

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Create upload record in Firestore
      const uploadId = await createUpload(file, file.name);
      
      if (!uploadId) {
        throw new Error("Failed to create upload record");
      }

      // Upload file to server
      const result = await uploadFile(file);
      
      if (!result.success) {
        throw new Error("Upload failed");
      }

      setUploadProgress(100);
      toast.success("Upload completed successfully");
      
      // Navigate to the preview page
      navigate(`/preview/${uploadId}`);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(error instanceof Error ? error.message : "Upload failed");
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setUploadProgress(0);
    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

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
