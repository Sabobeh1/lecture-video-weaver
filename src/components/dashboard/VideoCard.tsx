
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Play, MoreHorizontal, RefreshCw, Pencil, Download, File } from "lucide-react";
import { Link } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUploads } from "@/hooks/useUploads";
import { UploadStatus } from "@/types/upload";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface VideoCardProps {
  id: string;
  title: string;
  thumbnailUrl?: string;
  status: UploadStatus;
  createdAt: string;
  filename?: string;
}

export function VideoCard({ id, title, thumbnailUrl, status, createdAt, filename }: VideoCardProps) {
  const { retryUpload, downloadSlides } = useUploads();
  const formattedDate = new Date(createdAt).toLocaleDateString();
  const isProcessing = status === "processing";
  const isError = status === "error";

  const handleRetry = async (e: React.MouseEvent) => {
    e.preventDefault();
    await retryUpload(id);
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    await downloadSlides(id);
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
              <File size={32} className="opacity-50" />
            </div>
          )}
        </div>
        <StatusBadge status={status} className="absolute top-2 right-2" />
      </div>

      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-medium text-base line-clamp-1">{title}</h3>
            {filename && <p className="text-xs text-gray-500 mt-1">{filename}</p>}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link to={`/preview/${id}`}>Edit</Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDownload}>Download Slides</DropdownMenuItem>
              {isError && (
                <DropdownMenuItem onClick={handleRetry}>Retry Processing</DropdownMenuItem>
              )}
              <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <p className="text-sm text-gray-500 mt-1">{formattedDate}</p>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        {status === "completed" ? (
          <Link to={`/player/${id}`} className="w-full">
            <Button className="w-full" size="sm">
              <Play className="mr-2 h-4 w-4" />
              Play Video
            </Button>
          </Link>
        ) : isError ? (
          <Button 
            variant="outline" 
            className="w-full text-red-600 border-red-200 hover:bg-red-50" 
            size="sm"
            onClick={handleRetry}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry Processing
          </Button>
        ) : (
          <Link to={`/preview/${id}`} className="w-full">
            <Button variant="outline" className="w-full" size="sm">
              <Pencil className="mr-2 h-4 w-4" />
              Preview & Edit
            </Button>
          </Link>
        )}
      </CardFooter>
    </Card>
  );
}
