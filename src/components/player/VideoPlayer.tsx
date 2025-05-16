import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Download, Play, Pause, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface VideoPlayerProps {
  src: string;
  title?: string;
  allowDownload?: boolean;
  onDownload?: () => void;
}

export function VideoPlayer({ 
  src, 
  title,
  allowDownload = true,
  onDownload
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const controlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    
    if (!video) return;
    
    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };
    
    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setError(null);
    };
    
    const handlePlay = () => {
      setIsPlaying(true);
      setError(null);
    };
    
    const handlePause = () => {
      setIsPlaying(false);
    };
    
    const handleEnded = () => {
      setIsPlaying(false);
    };

    const handleError = (e: Event) => {
      const videoElement = e.target as HTMLVideoElement;
      let errorMessage = "An error occurred while playing the video.";
      
      if (videoElement.error) {
        switch (videoElement.error.code) {
          case 1:
            errorMessage = "The video loading was aborted.";
            break;
          case 2:
            errorMessage = "Network error occurred while loading the video.";
            break;
          case 3:
            errorMessage = "The video could not be decoded.";
            break;
          case 4:
            errorMessage = "The video format is not supported.";
            break;
        }
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    };
    
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("ended", handleEnded);
    video.addEventListener("error", handleError);
    
    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("ended", handleEnded);
      video.removeEventListener("error", handleError);
    };
  }, []);

  const handleMouseMove = () => {
    showControls();
  };

  const showControls = () => {
    setControlsVisible(true);
    
    if (controlsTimer.current) {
      clearTimeout(controlsTimer.current);
    }
    
    controlsTimer.current = setTimeout(() => {
      if (isPlaying) {
        setControlsVisible(false);
      }
    }, 3000);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;
    
    if (video.paused) {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error("Error playing video:", error);
          setError("Failed to play video. Please try again.");
          toast.error("Failed to play video. Please try again.");
        });
      }
    } else {
      video.pause();
    }
  };

  const handleSliderChange = (value: number[]) => {
    const video = videoRef.current;
    if (!video) return;
    
    video.currentTime = value[0];
    setCurrentTime(value[0]);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    
    setIsMuted(!isMuted);
    video.muted = !isMuted;
  };

  const handleVolumeChange = (value: number[]) => {
    const video = videoRef.current;
    if (!video) return;
    
    const newVolume = value[0];
    setVolume(newVolume);
    video.volume = newVolume;
    setIsMuted(newVolume === 0);
  };

  const handleDownload = () => {
    if (onDownload) {
      onDownload();
    } else {
      // Default download behavior
      const link = document.createElement("a");
      link.href = src;
      link.download = title || "video";
      link.click();
    }
  };

  return (
    <div 
      className="relative w-full aspect-video bg-black rounded-lg overflow-hidden"
      onMouseMove={handleMouseMove}
    >
      <video ref={videoRef} className="w-full h-full" onClick={togglePlayPause} controls={false} playsInline>
        <source src="/attach/videoplayback.mp4" type="video/mp4" />
        <source src="/attach/videoplayback.webm" type="video/webm" />
        Your browser does not support the video tag.
      </video>
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="text-white text-center p-4">
            <p className="font-medium mb-2">Error Playing Video</p>
            <p className="text-sm">{error}</p>
            <Button 
              variant="outline" 
              className="mt-4 text-white border-white hover:bg-white/20"
              onClick={togglePlayPause}
            >
              Try Again
            </Button>
          </div>
        </div>
      )}
      
      <div 
        className={cn(
          "absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent transition-opacity duration-300 flex flex-col gap-2",
          controlsVisible ? "opacity-100" : "opacity-0"
        )}
      >
        {title && (
          <p className="text-white font-medium text-sm mb-1">{title}</p>
        )}
        
        <div className="flex items-center gap-2">
          <span className="text-white/80 text-xs">
            {formatTime(currentTime)}
          </span>
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={0.01}
            onValueChange={handleSliderChange}
            className="flex-1"
          />
          <span className="text-white/80 text-xs">
            {formatTime(duration)}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-white rounded-full h-8 w-8"
            onClick={togglePlayPause}
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </Button>
          
          <div 
            className="relative"
            onMouseEnter={() => setShowVolumeSlider(true)}
            onMouseLeave={() => setShowVolumeSlider(false)}
          >
            <Button
              variant="ghost"
              size="icon"
              className="text-white rounded-full h-8 w-8"
              onClick={toggleMute}
            >
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </Button>
            
            {showVolumeSlider && (
              <div className="absolute bottom-full left-2 p-3 bg-black/90 rounded-md mb-2 w-32">
                <Slider
                  value={[isMuted ? 0 : volume]}
                  max={1}
                  step={0.01}
                  onValueChange={handleVolumeChange}
                />
              </div>
            )}
          </div>
          
          {allowDownload && (
            <Button
              variant="ghost"
              size="icon"
              className="text-white rounded-full h-8 w-8"
              onClick={handleDownload}
            >
              <Download size={20} />
            </Button>
          )}
        </div>
      </div>
      
      {!isPlaying && !error && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/20 backdrop-blur-sm text-white h-16 w-16"
          onClick={togglePlayPause}
        >
          <Play size={32} />
        </Button>
      )}
    </div>
  );
}
