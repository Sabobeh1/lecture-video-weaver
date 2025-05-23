import { AppLayout } from "@/components/layout/AppLayout";
import { FileUploader } from "@/components/upload/FileUploader";
import { VideoUploader } from "@/components/upload/VideoUploader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useVideoStorage } from "@/hooks/useVideoStorage";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Play, Download, Video, Calendar, Trash2 } from "lucide-react";
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

const Upload = () => {
  const { 
    videos, 
    loading, 
    formatFileSize, 
    videoCount, 
    deleteVideo 
  } = useVideoStorage();
  
  const [showAllVideos, setShowAllVideos] = useState(false);
  const [deletingVideoId, setDeletingVideoId] = useState<string | null>(null);
  
  // Get the most recent videos (limited to 3) for the condensed view
  const recentVideos = videos.slice(0, 3);
  
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

  const handlePlayVideo = (video: any) => {
    const url = URL.createObjectURL(video.videoBlob);
    window.open(url, '_blank');
  };

  const handleDownloadVideo = (video: any) => {
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

  return (
    <AppLayout title="Upload Slides" subtitle="Upload your presentation slides to create a video lecture">
      <div className="space-y-8">
        <Tabs defaultValue="standard" className="w-full">
          <CardHeader>
            {/* <div className="flex justify-between items-center">
              <CardTitle>Upload Slides</CardTitle>
              <TabsList>
                <TabsTrigger value="standard">Standard Upload</TabsTrigger>
                <TabsTrigger value="preview">Quick Preview</TabsTrigger>
              </TabsList>
            </div> */}
            <CardDescription>
              Upload your PDF or PowerPoint slides to generate an AI-narrated video lecture
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <TabsContent value="standard">
              <FileUploader />
            </TabsContent>
            
            <TabsContent value="preview">
              <VideoUploader 
                loadingDelay={12}
              />
            </TabsContent>
          </CardContent>
        </Tabs>
        
        {loading ? (
          <div className="space-y-4">
            <h2 className="text-xl font-heading font-semibold">Recent Videos</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="aspect-video w-full" />
                  <div className="p-4">
                    <Skeleton className="h-5 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ) : videoCount > 0 ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-heading font-semibold">
                {showAllVideos ? `All Videos (${videoCount})` : "Recent Videos"}
              </h2>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowAllVideos(!showAllVideos)}
                >
                  {showAllVideos ? "Show Recent" : `Show All (${videoCount})`}
                </Button>
                <Link to="/videos">
                  <Button variant="secondary">
                    <Video size={16} className="mr-2" />
                    Manage Videos
                  </Button>
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(showAllVideos ? videos : recentVideos).map((video) => (
                <LocalVideoCard
                  key={video.id}
                  video={video}
                  formatFileSize={formatFileSize}
                  onPlay={handlePlayVideo}
                  onDownload={handleDownloadVideo}
                  onDelete={handleDeleteVideo}
                  isDeleting={deletingVideoId === video.id}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-heading font-semibold">Generated Videos</h2>
            </div>
            <Card className="p-8 text-center">
              <Video size={48} className="mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No videos yet</h3>
              <p className="text-gray-500 mb-4">
                Upload your first PDF or PowerPoint slides above to generate a video lecture!
              </p>
              <p className="text-sm text-gray-400">
                Generated videos will appear here and be stored locally for offline access.
              </p>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

// Component for displaying local videos in upload page
function LocalVideoCard({ 
  video, 
  formatFileSize, 
  onPlay, 
  onDownload, 
  onDelete, 
  isDeleting 
}: { 
  video: any; 
  formatFileSize: (bytes: number) => string;
  onPlay: (video: any) => void;
  onDownload: (video: any) => void;
  onDelete: (id: string, fileName: string) => void;
  isDeleting: boolean;
}) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative aspect-video bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <Button
          variant="secondary"
          size="lg"
          onClick={() => onPlay(video)}
          className="bg-white/80 hover:bg-white/90"
        >
          <Play size={24} className="mr-2" />
          Play Video
        </Button>
        
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
              onClick={() => onPlay(video)}
            >
              <Play size={16} className="mr-1" />
              Play
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onDownload(video)}
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

export default Upload;
