
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Play, MoreHorizontal, RefreshCw, Pencil, Archive } from "lucide-react";
import { Link } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUploads } from "@/hooks/useUploads";
import { UploadStatus, SSHTransferStatus } from "@/types/upload";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

interface VideoCardProps {
  id: string;
  title: string;
  thumbnailUrl?: string;
  status: UploadStatus;
  sshStatus?: SSHTransferStatus;
  sshProgress?: number;
  createdAt: string;
}

export function VideoCard({ 
  id, 
  title, 
  thumbnailUrl, 
  status, 
  sshStatus = "idle",
  sshProgress = 0,
  createdAt 
}: VideoCardProps) {
  const { retryUpload, retrySSHTransfer } = useUploads();
  const formattedDate = new Date(createdAt).toLocaleDateString();
  const isProcessing = status === "processing";
  const isSSHTransferring = sshStatus === "transferring" || sshStatus === "pending";
  
  const handleRetry = async (e: React.MouseEvent) => {
    e.preventDefault();
    await retryUpload(id);
  };
  
  const handleRetrySSH = async (e: React.MouseEvent) => {
    e.preventDefault();
    await retrySSHTransfer(id);
  };

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <div className="relative">
        <div className="aspect-video bg-gray-200 overflow-hidden">
          {isProcessing ? (
            <div className="w-full h-full flex items-center justify-center">
              <Skeleton className="w-full h-full" />
            </div>
          ) : thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt={title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400">
              No Preview
            </div>
          )}
        </div>
        <StatusBadge status={status} className="absolute top-2 right-2" />
      </div>

      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <h3 className="font-medium text-base line-clamp-1">{title}</h3>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Edit</DropdownMenuItem>
              {status === "completed" && (
                <DropdownMenuItem>Download</DropdownMenuItem>
              )}
              {sshStatus === "error" && (
                <DropdownMenuItem onClick={handleRetrySSH}>
                  Retry SSH Transfer
                </DropdownMenuItem>
              )}
              <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <p className="text-sm text-gray-500 mt-1">{formattedDate}</p>
        
        {/* SSH Archive Status */}
        {sshStatus !== "idle" && (
          <div className="mt-2">
            <div className="flex justify-between items-center text-xs text-gray-500 mb-1">
              <div className="flex items-center gap-1">
                <Archive className="h-3 w-3" />
                <span>
                  {sshStatus === "pending" && "Preparing Archive"}
                  {sshStatus === "transferring" && "Archiving"}
                  {sshStatus === "completed" && "Archived"}
                  {sshStatus === "error" && "Archive Failed"}
                </span>
              </div>
              {isSSHTransferring && <span>{sshProgress}%</span>}
            </div>
            
            {isSSHTransferring && (
              <Progress value={sshProgress} className="h-1" />
            )}
            
            {sshStatus === "error" && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full mt-1 text-xs text-red-600 h-6 p-0"
                onClick={handleRetrySSH}
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Retry Archive
              </Button>
            )}
            
            {sshStatus === "completed" && (
              <div className="flex items-center text-green-600 text-xs mt-1">
                <Archive className="h-3 w-3 mr-1" />
                <span>SSH Archive Complete</span>
              </div>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="p-4 pt-0">
        {status === "completed" ? (
          <Link to={`/player/${id}`} className="w-full">
            <Button className="w-full" size="sm">
              <Play className="mr-2 h-4 w-4" />
              Play Video
            </Button>
          </Link>
        ) : status === "pending" || status === "processing" ? (
          <Link to={`/preview/${id}`} className="w-full">
            <Button variant="outline" className="w-full" size="sm">
              <Pencil className="mr-2 h-4 w-4" />
              Preview & Edit
            </Button>
          </Link>
        ) : (
          <Button 
            variant="outline" 
            className="w-full text-red-600" 
            size="sm"
            onClick={handleRetry}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
