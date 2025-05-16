import React, { useState, useRef, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface VideoUploadPreviewProps {
  loadingDelay?: number; // Delay in milliseconds, default 10000 (10 seconds)
}

const VideoUploadPreview: React.FC<VideoUploadPreviewProps> = ({ 
  loadingDelay = 10000 
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    // Simulate upload completion
    setTimeout(() => {
      setIsUploading(false);
      setIsLoading(true);

      // Simulate processing delay
      setTimeout(() => {
        setIsLoading(false);
        setIsReady(true);
      }, loadingDelay);
    }, 1000);
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();

    const file = event.dataTransfer.files?.[0];
    if (file && fileInputRef.current) {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      fileInputRef.current.files = dataTransfer.files;
      handleFileUpload({ target: { files: dataTransfer.files } } as any);
    }
  };

  useEffect(() => {
    if (isReady && videoRef.current) {
      try {
        // Create a URL for the video file
        const videoUrl = 'file:///C:/Users/HP/Downloads/videoplayback.mp4';
        console.log('Attempting to load video from:', videoUrl);
        
        videoRef.current.src = videoUrl;
        
        // Add event listeners for better error handling
        videoRef.current.onerror = (e) => {
          console.error('Video error:', e);
          setError('Failed to load video. Please check if the video file exists and is accessible.');
        };

        videoRef.current.onloadeddata = () => {
          console.log('Video loaded successfully');
          videoRef.current?.play().catch((err) => {
            console.error('Playback error:', err);
            setError('Failed to play video. Please check if the video file exists.');
          });
        };
      } catch (err) {
        console.error('Error setting up video:', err);
        setError('Failed to initialize video player.');
      }
    }
  }, [isReady]);

  return (
    <div className="w-full max-w-3xl mx-auto p-4">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center ${
          isUploading ? 'border-blue-500' : 'border-gray-300'
        }`}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {!isReady && !isLoading && (
          <>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              accept=".pdf,.ppt,.pptx"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Upload Slide Lectures
            </button>
            <p className="mt-2 text-sm text-gray-500">
              Drag and drop your files here or click to browse
            </p>
          </>
        )}

        {isLoading && (
          <div className="flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <p className="mt-2 text-sm text-gray-600">Processing your lecture...</p>
          </div>
        )}

        {isReady && (
          <div className="w-full">
            <video
              ref={videoRef}
              className="w-full rounded-lg"
              controls
              autoPlay
              playsInline
              style={{ maxHeight: '70vh' }}
            >
              Your browser does not support the video tag.
            </video>
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-lg">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoUploadPreview; 