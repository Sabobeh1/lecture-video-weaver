import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  HardDrive, 
  Trash2, 
  Download, 
  Play, 
  AlertTriangle, 
  CheckCircle,
  RefreshCw,
  Settings,
  Database
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useVideoStorage } from '@/hooks/useVideoStorage';
import { toast } from 'sonner';
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

export function StorageManager() {
  const {
    videos,
    storageQuota,
    loading,
    error,
    deleteVideo,
    clearAllVideos,
    refreshData,
    formatFileSize,
    videoCount,
    totalStorageUsed,
  } = useVideoStorage();

  const [deletingVideoId, setDeletingVideoId] = useState<string | null>(null);
  const [isClearing, setIsClearing] = useState(false);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <RefreshCw className="animate-spin mr-2" size={20} />
          <span>Loading storage information...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="py-8">
          <div className="flex items-center gap-3 text-red-700">
            <AlertTriangle size={24} />
            <div>
              <h3 className="font-medium">Storage Error</h3>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            onClick={refreshData} 
            className="mt-4"
          >
            <RefreshCw size={16} className="mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const usagePercentage = storageQuota && storageQuota.quota > 0 
    ? (storageQuota.usage / storageQuota.quota) * 100 
    : 0;

  const isHighUsage = usagePercentage > 80;
  const isCriticalUsage = usagePercentage > 95;

  const handleDeleteVideo = async (videoId: string) => {
    setDeletingVideoId(videoId);
    try {
      await deleteVideo(videoId);
    } finally {
      setDeletingVideoId(null);
    }
  };

  const handleClearAllVideos = async () => {
    setIsClearing(true);
    try {
      await clearAllVideos();
    } finally {
      setIsClearing(false);
    }
  };

  const handleDownloadVideo = (video: { videoBlob: Blob; fileName: string }) => {
    const url = URL.createObjectURL(video.videoBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = video.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Video download started');
  };

  const handlePlayVideo = (video: { videoBlob: Blob; fileName: string }) => {
    const url = URL.createObjectURL(video.videoBlob);
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Storage Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive size={20} />
            Storage Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {storageQuota ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">
                    {formatFileSize(storageQuota.usage)}
                  </div>
                  <div className="text-sm text-gray-600">Used</div>
                </div>
                
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {formatFileSize(storageQuota.available)}
                  </div>
                  <div className="text-sm text-gray-600">Available</div>
                </div>
                
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {storageQuota.quota > 0 ? formatFileSize(storageQuota.quota) : 'Unlimited'}
                  </div>
                  <div className="text-sm text-gray-600">Total Quota</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span>Storage Usage</span>
                  <span className={cn(
                    isCriticalUsage ? 'text-red-600 font-medium' :
                    isHighUsage ? 'text-orange-600' : 'text-gray-600'
                  )}>
                    {usagePercentage.toFixed(1)}%
                  </span>
                </div>
                <Progress 
                  value={usagePercentage} 
                  className={cn(
                    "h-3",
                    isCriticalUsage && "[&>div]:bg-red-500",
                    isHighUsage && !isCriticalUsage && "[&>div]:bg-orange-500"
                  )}
                />
                
                {isCriticalUsage && (
                  <div className="flex items-center gap-2 text-red-600 text-sm mt-2">
                    <AlertTriangle size={16} />
                    <span>Critical: Storage nearly full. Consider deleting old videos.</span>
                  </div>
                )}
                
                {isHighUsage && !isCriticalUsage && (
                  <div className="flex items-center gap-2 text-orange-600 text-sm mt-2">
                    <AlertTriangle size={16} />
                    <span>Warning: Storage usage is high.</span>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-4 text-gray-500">
              <Database size={48} className="mx-auto mb-2 opacity-50" />
              <p>Storage information unavailable</p>
            </div>
          )}

          <div className="flex gap-2">
            <Button variant="outline" onClick={refreshData}>
              <RefreshCw size={16} className="mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Video Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Play size={20} />
              Stored Videos ({videoCount})
            </CardTitle>
            
            {videoCount > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 size={16} className="mr-2" />
                    Clear All
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete All Videos?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete all {videoCount} stored videos. 
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleClearAllVideos}
                      disabled={isClearing}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {isClearing ? (
                        <>
                          <RefreshCw size={16} className="mr-2 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        'Delete All'
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {videoCount === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Play size={48} className="mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No Videos Stored</h3>
              <p className="text-sm">
                Generated videos will appear here and be stored locally for offline access.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-sm text-gray-600 mb-4">
                Total storage used by videos: <strong>{formatFileSize(totalStorageUsed)}</strong>
              </div>
              
              {videos.map((video) => (
                <Card key={video.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium truncate">{video.fileName}</h4>
                        <Badge variant="secondary" className="text-xs">
                          {formatFileSize(video.fileSize)}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-500">
                        Created: {new Date(video.timestamp).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handlePlayVideo(video)}
                      >
                        <Play size={16} className="mr-1" />
                        Play
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDownloadVideo(video)}
                      >
                        <Download size={16} className="mr-1" />
                        Download
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            disabled={deletingVideoId === video.id}
                          >
                            {deletingVideoId === video.id ? (
                              <RefreshCw size={16} className="animate-spin" />
                            ) : (
                              <Trash2 size={16} />
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Video?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete "{video.fileName}". 
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDeleteVideo(video.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Storage Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings size={20} />
            Storage Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <CheckCircle size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <strong>Large Storage Capacity:</strong> This app uses IndexedDB which can store much larger files than traditional web storage (typically several GB).
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <CheckCircle size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <strong>Persistent Storage:</strong> The app requests persistent storage to prevent data from being automatically deleted by the browser.
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <CheckCircle size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <strong>Offline Access:</strong> Stored videos are available even when you're offline, providing seamless access to your content.
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <AlertTriangle size={16} className="text-orange-600 mt-0.5 flex-shrink-0" />
              <div>
                <strong>Browser Limitation:</strong> Storage quota is controlled by the browser and depends on available disk space and browser policies.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 