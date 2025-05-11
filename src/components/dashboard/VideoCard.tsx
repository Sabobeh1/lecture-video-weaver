
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Play, MoreHorizontal, RefreshCw, Pencil } from "lucide-react";
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

interface VideoCardProps {
  id: string;
  title: string;
  thumbnailUrl?: string;
  status: UploadStatus;
  createdAt: string;
}

export function VideoCard({ id, title, thumbnailUrl, status, createdAt }: VideoCardProps) {
  const { retryUpload } = useUploads();
  const formattedDate = new Date(createdAt).toLocaleDateString();
  const isProcessing = status === "processing";

  const handleRetry = async (e: React.MouseEvent) => {
    e.preventDefault();
    await retryUpload(id);
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
