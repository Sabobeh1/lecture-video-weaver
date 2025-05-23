import { useState } from "react";
import React from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Play, 
  Download, 
  Search, 
  Video, 
  Calendar,
  FileIcon,
  Trash2,
  Eye
} from "lucide-react";
import { Link } from "react-router-dom";
import { useVideoStorage } from "@/hooks/useVideoStorage";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const MyVideos = () => {
  const { 
    videos, 
    loading, 
    formatFileSize, 
    videoCount, 
    totalStorageUsed,
    deleteVideo 
  } = useVideoStorage();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [deletingVideoId, setDeletingVideoId] = useState<string | null>(null);

  // Filter and sort videos
  const filteredAndSortedVideos = videos
    .filter(video => 
      video.fileName.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return b.timestamp - a.timestamp;
        case "oldest":
          return a.timestamp - b.timestamp;
        case "name":
          return a.fileName.localeCompare(b.fileName);
        case "size":
          return b.fileSize - a.fileSize;
        default:
          return b.timestamp - a.timestamp;
      }
    });

  const handleDeleteVideo = async (videoId: string, fileName: string) => {
    setDeletingVideoId(videoId);
    try {
      const success = await deleteVideo(videoId);
      if (success) {
        toast.success(`"${fileName}" deleted successfully`);
      }
    } catch (error) {
      console.error('Error deleting video:', error);
      toast.error('Failed to delete video');
    } finally {
      setDeletingVideoId(null);
    }
  };

  if (loading) {
    return (
      <AppLayout title="My Videos" subtitle="Manage your generated lecture videos">
        <div className="space-y-6">
          {/* Loading skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="aspect-video w-full" />
                <CardContent className="p-4">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2 mb-3" />
                  <Skeleton className="h-8 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="My Videos" subtitle={`${videoCount} generated videos • ${formatFileSize(totalStorageUsed)} total`}>
      <div className="space-y-6">
        {/* Controls */}
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <Input
                placeholder="Search videos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="name">Name (A-Z)</SelectItem>
                <SelectItem value="size">Size (Largest)</SelectItem>
              </SelectContent>
            </Select>

            <Select value={viewMode} onValueChange={(value) => setViewMode(value as "grid" | "list")}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="View" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="grid">Grid View</SelectItem>
                <SelectItem value="list">List View</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Link to="/upload">
            <Button>
              <Video size={20} className="mr-2" />
              Generate New Video
            </Button>
          </Link>
        </div>

        {/* Videos Display */}
        {filteredAndSortedVideos.length === 0 ? (
          <div className="text-center py-12">
            {searchQuery ? (
              <div>
                <Search size={48} className="mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No videos found</h3>
                <p className="text-gray-500 mb-4">
                  No videos match your search for "{searchQuery}". Try adjusting your search terms.
                </p>
                <Button variant="outline" onClick={() => setSearchQuery("")}>
                  Clear Search
                </Button>
              </div>
            ) : videoCount === 0 ? (
              <div>
                <Video size={48} className="mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No videos yet</h3>
                <p className="text-gray-500 mb-4">
                  Upload your first PDF to generate a lecture video and it will appear here.
                </p>
                <Link to="/upload">
                  <Button>
                    <Video size={20} className="mr-2" />
                    Upload PDF
                  </Button>
                </Link>
              </div>
            ) : null}
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedVideos.map((video) => (
              <VideoGridCard
                key={video.id}
                video={video}
                formatFileSize={formatFileSize}
                onDelete={handleDeleteVideo}
                isDeleting={deletingVideoId === video.id}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAndSortedVideos.map((video) => (
              <VideoListCard
                key={video.id}
                video={video}
                formatFileSize={formatFileSize}
                onDelete={handleDeleteVideo}
                isDeleting={deletingVideoId === video.id}
              />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

// Grid view card component
function VideoGridCard({ 
  video, 
  formatFileSize, 
  onDelete, 
  isDeleting 
}: { 
  video: any; 
  formatFileSize: (bytes: number) => string;
  onDelete: (id: string, fileName: string) => void;
  isDeleting: boolean;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const handlePlay = () => {
    if (!videoUrl) {
      const url = URL.createObjectURL(video.videoBlob);
      setVideoUrl(url);
    }
    setIsPlaying(true);
  };

  const handleDownload = () => {
    const url = URL.createObjectURL(video.videoBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = video.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Download started');
  };

  const handleViewInNewTab = () => {
    const url = URL.createObjectURL(video.videoBlob);
    window.open(url, '_blank');
  };

  React.useEffect(() => {
    return () => {
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [videoUrl]);

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative aspect-video bg-gray-200">
        {isPlaying && videoUrl ? (
          <video 
            src={videoUrl} 
            controls 
            className="w-full h-full object-cover"
            onError={() => setIsPlaying(false)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
            <Button
              variant="secondary"
              size="lg"
              onClick={handlePlay}
              className="bg-white/80 hover:bg-white/90"
            >
              <Play size={24} className="mr-2" />
              Play Video
            </Button>
          </div>
        )}
        
        <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
          {formatFileSize(video.fileSize)}
        </div>
      </div>

      <CardContent className="p-4">
        <div className="space-y-3">
          <div>
            <h3 className="font-semibold text-gray-900 line-clamp-2 mb-1" title={video.fileName}>
              {video.fileName}
            </h3>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar size={14} />
              <span>
                {new Date(video.timestamp).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={handlePlay}
            >
              <Play size={16} className="mr-1" />
              Play
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleViewInNewTab}
            >
              <Eye size={16} />
            </Button>

            <Button 
              variant="outline" 
              size="sm"
              onClick={handleDownload}
            >
              <Download size={16} />
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive" 
                  size="sm"
                  disabled={isDeleting}
                >
                  <Trash2 size={16} />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Video?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete "{video.fileName}". This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={() => onDelete(video.id, video.fileName)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// List view card component
function VideoListCard({ 
  video, 
  formatFileSize, 
  onDelete, 
  isDeleting 
}: { 
  video: any; 
  formatFileSize: (bytes: number) => string;
  onDelete: (id: string, fileName: string) => void;
  isDeleting: boolean;
}) {
  const handleDownload = () => {
    const url = URL.createObjectURL(video.videoBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = video.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Download started');
  };

  const handlePlay = () => {
    const url = URL.createObjectURL(video.videoBlob);
    window.open(url, '_blank');
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
            <FileIcon size={24} className="text-blue-600" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate mb-1" title={video.fileName}>
              {video.fileName}
            </h3>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Calendar size={14} />
                <span>
                  {new Date(video.timestamp).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </span>
              </div>
              <Badge variant="secondary" className="text-xs">
                {formatFileSize(video.fileSize)}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handlePlay}
            >
              <Play size={16} className="mr-1" />
              Play
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleDownload}
            >
              <Download size={16} />
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive" 
                  size="sm"
                  disabled={isDeleting}
                >
                  <Trash2 size={16} />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Video?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete "{video.fileName}". This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={() => onDelete(video.id, video.fileName)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default MyVideos; 