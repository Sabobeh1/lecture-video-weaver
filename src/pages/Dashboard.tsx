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
import { Plus, Search, Video, HardDrive } from "lucide-react";
import { Link } from "react-router-dom";
import { useFirebaseVideoStorage } from "@/hooks/useFirebaseVideoStorage";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

const Dashboard = () => {
  const { videos, loading, formatFileSize, videoCount, totalStorageUsed } = useFirebaseVideoStorage();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<string>("newest");

  // Filter and sort videos based on search query and sort option
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

  if (loading) {
    return (
      <AppLayout title="Dashboard" subtitle="Manage your generated videos">
        <div className="space-y-6">
          {/* Loading skeleton for stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Loading skeleton for videos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="aspect-video w-full" />
                <CardContent className="p-4">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Dashboard" subtitle="Manage your generated videos">
      <div className="space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Video className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Videos</p>
                  <p className="text-2xl font-bold">{videoCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <HardDrive className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Storage Used</p>
                  <p className="text-2xl font-bold">{formatFileSize(totalStorageUsed)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Plus className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Quick Action</p>
                  <Link to="/upload">
                    <Button size="sm" className="mt-1">
                      Upload New PDF
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <Input
                placeholder="Search videos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="name">Name (A-Z)</SelectItem>
                <SelectItem value="size">Size (Largest)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Link to="/upload">
            <Button>
              <Plus size={20} className="mr-2" />
              New Video
            </Button>
          </Link>
        </div>

        {/* Videos Grid */}
        {filteredAndSortedVideos.length === 0 ? (
          <div className="text-center py-12">
            {searchQuery ? (
              <div>
                <Video size={48} className="mx-auto mb-4 text-gray-400" />
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
                    <Plus size={20} className="mr-2" />
                    Upload PDF
                  </Button>
                </Link>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedVideos.map((video) => (
              <LocalVideoCard
                key={video.id}
                video={video}
                formatFileSize={formatFileSize}
              />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

// Component for displaying local videos
function LocalVideoCard({ 
  video, 
  formatFileSize 
}: { 
  video: any; 
  formatFileSize: (bytes: number) => string;
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
  };

  // Cleanup URL when component unmounts
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
              <Video size={24} className="mr-2" />
              Play Video
            </Button>
          </div>
        )}
        
        {/* Video info badge */}
        <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
          {formatFileSize(video.fileSize)}
        </div>
      </div>

      <CardContent className="p-4">
        <div className="space-y-3">
          <div>
            <h3 className="font-semibold text-gray-900 line-clamp-1" title={video.fileName}>
              {video.fileName}
            </h3>
            <p className="text-sm text-gray-500">
              Created {new Date(video.timestamp).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={handlePlay}
            >
              <Video size={16} className="mr-1" />
              {isPlaying ? 'Playing' : 'Play'}
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleDownload}
            >
              <Plus size={16} />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default Dashboard;
