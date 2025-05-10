
import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { VideoCard } from "@/components/dashboard/VideoCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { useUploads } from "@/hooks/useUploads";
import { UploadStatus } from "@/types/upload";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

const Dashboard = () => {
  const { uploads, loading } = useUploads();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Filter uploads based on search query and status filter
  const filteredVideos = uploads.filter(video => {
    const matchesSearch = video.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || video.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <AppLayout title="Dashboard" subtitle="Manage your lecture videos">
      <div className="space-y-6">
        {/* Filters and actions */}
        <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <Input
                type="search"
                placeholder="Search videos..."
                className="pl-10 pr-4"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Videos</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Link to="/upload">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Video
            </Button>
          </Link>
        </div>
        
        {/* Loading state */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-40" />
                <div className="p-4">
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
                <div className="p-4 pt-0">
                  <Skeleton className="h-9 w-full" />
                </div>
              </Card>
            ))}
          </div>
        )}
        
        {/* Video grid */}
        {!loading && filteredVideos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredVideos.map((video) => (
              <VideoCard 
                key={video.id} 
                id={video.id}
                title={video.title}
                thumbnailUrl={video.thumbnailUrl}
                status={video.status}
                createdAt={video.createdAt}
              />
            ))}
          </div>
        ) : !loading ? (
          <div className="text-center py-12 bg-white rounded-lg border">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Search size={24} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium">No videos found</h3>
            <p className="text-gray-500 mt-2">
              {searchQuery || statusFilter !== "all"
                ? "Try adjusting your search or filter criteria"
                : "Upload new slides to create your first video lecture"}
            </p>
            {!searchQuery && statusFilter === "all" && (
              <Link to="/upload">
                <Button className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Upload Slides
                </Button>
              </Link>
            )}
          </div>
        ) : null}
      </div>
    </AppLayout>
  );
};

export default Dashboard;
