
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { VideoPlayer as Player } from "@/components/player/VideoPlayer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DownloadIcon, CalendarIcon, ClockIcon, ShareIcon, BookmarkIcon } from "lucide-react";

// Mock video data
const mockVideo = {
  id: "123",
  title: "Introduction to Machine Learning",
  description: "Learn the fundamentals of machine learning including supervised and unsupervised learning techniques.",
  url: "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4", // Sample video URL
  thumbnailUrl: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&w=500",
  dateCreated: "2025-05-01T14:30:00Z",
  duration: "12:45",
  author: {
    name: "John Doe",
    avatarUrl: "",
  }
};

const VideoPlayerPage = () => {
  const { id } = useParams<{ id: string }>();
  const [video, setVideo] = useState(mockVideo);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate API call to get video data
    console.log(`Loading video data for ID: ${id}`);
    
    setTimeout(() => {
      setIsLoading(false);
      // In a real app, we would fetch the video by ID
    }, 1000);
  }, [id]);

  const handleDownload = () => {
    // In a real app, this would trigger the actual download
    console.log("Downloading video:", video.title);
  };

  const handleShare = () => {
    // In a real app, this would open a share dialog
    console.log("Sharing video:", video.title);
  };

  const handleSave = () => {
    // In a real app, this would save the video to user's library
    console.log("Saving video:", video.title);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <AppLayout title="Video Player" subtitle="Loading video...">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Video Player" subtitle="Watch your generated lecture">
      <div className="space-y-6">
        {/* Video player */}
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <Player 
              src={video.url}
              title={video.title}
              onDownload={handleDownload}
            />
          </CardContent>
        </Card>

        {/* Video information */}
        <Card>
          <CardHeader>
            <CardTitle>{video.title}</CardTitle>
            <CardDescription className="flex flex-wrap gap-4 items-center text-sm text-gray-500">
              <span className="flex items-center">
                <CalendarIcon size={16} className="mr-1" />
                {formatDate(video.dateCreated)}
              </span>
              <span className="flex items-center">
                <ClockIcon size={16} className="mr-1" />
                {video.duration}
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={video.author.avatarUrl} />
                  <AvatarFallback>{video.author.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{video.author.name}</p>
                  <p className="text-sm text-gray-500">Creator</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={handleSave}>
                  <BookmarkIcon size={18} className="mr-2" />
                  Save
                </Button>
                <Button variant="outline" onClick={handleShare}>
                  <ShareIcon size={18} className="mr-2" />
                  Share
                </Button>
                <Button onClick={handleDownload}>
                  <DownloadIcon size={18} className="mr-2" />
                  Download
                </Button>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="font-medium mb-2">Description</h3>
              <p className="text-gray-700">{video.description}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default VideoPlayerPage;
