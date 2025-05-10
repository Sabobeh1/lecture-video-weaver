
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

// Mock data for demonstration
const mockVideos = [
  {
    id: "1",
    title: "Introduction to Machine Learning",
    thumbnailUrl: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&w=500",
    status: "completed" as const,
    createdAt: "2025-04-25T10:30:00Z",
  },
  {
    id: "2",
    title: "Advanced Data Structures",
    thumbnailUrl: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&w=500",
    status: "processing" as const,
    createdAt: "2025-05-01T15:20:00Z",
  },
  {
    id: "3",
    title: "Web Development Fundamentals",
    thumbnailUrl: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&w=500",
    status: "pending" as const,
    createdAt: "2025-05-08T09:15:00Z",
  },
  {
    id: "4",
    title: "Quantum Computing Basics",
    thumbnailUrl: "",
    status: "error" as const,
    createdAt: "2025-04-20T11:45:00Z",
  },
];

const Dashboard = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredVideos = mockVideos.filter(video => {
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
        
        {/* Video grid */}
        {filteredVideos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredVideos.map((video) => (
              <VideoCard key={video.id} {...video} />
            ))}
          </div>
        ) : (
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
        )}
      </div>
    </AppLayout>
  );
};

export default Dashboard;
