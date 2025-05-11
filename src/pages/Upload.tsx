
import { AppLayout } from "@/components/layout/AppLayout";
import { FileUploader } from "@/components/upload/FileUploader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useUploads } from "@/hooks/useUploads";
import { VideoCard } from "@/components/dashboard/VideoCard";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Eye, Pencil, Play } from "lucide-react";

const Upload = () => {
  const { uploads, loading } = useUploads();
  const [showAllUploads, setShowAllUploads] = useState(false);
  
  // Get the most recent uploads (limited to 2) for the condensed view
  const recentUploads = uploads.slice(0, 2);
  
  // Format date for the table
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <AppLayout title="Upload Slides" subtitle="Upload your presentation slides to create a video lecture">
      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Upload Slides</CardTitle>
            <CardDescription>
              Upload your PDF or PowerPoint slides to generate an AI-narrated video lecture
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FileUploader />
          </CardContent>
        </Card>
        
        {loading ? (
          <div className="space-y-4">
            <h2 className="text-xl font-heading font-semibold">Recent Uploads</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2].map((i) => (
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
          </div>
        ) : uploads.length > 0 ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-heading font-semibold">
                {showAllUploads ? "All Uploads" : "Recent Uploads"}
              </h2>
              <Button 
                variant="outline" 
                onClick={() => setShowAllUploads(!showAllUploads)}
              >
                {showAllUploads ? "Show Recent" : "Show All"}
              </Button>
            </div>

            {showAllUploads ? (
              <Card>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created Date</TableHead>
                        <TableHead>Last Updated</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {uploads.map((upload) => (
                        <TableRow key={upload.id}>
                          <TableCell className="font-medium">{upload.title}</TableCell>
                          <TableCell><StatusBadge status={upload.status} /></TableCell>
                          <TableCell>{formatDate(upload.createdAt)}</TableCell>
                          <TableCell>{formatDate(upload.updatedAt)}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              {upload.status === "completed" ? (
                                <Link to={`/player/${upload.id}`}>
                                  <Button size="sm" variant="ghost">
                                    <Play className="h-4 w-4 mr-1" /> Play
                                  </Button>
                                </Link>
                              ) : (
                                <Link to={`/preview/${upload.id}`}>
                                  <Button size="sm" variant="ghost">
                                    {upload.status === "error" ? (
                                      <>
                                        <Eye className="h-4 w-4 mr-1" /> View
                                      </>
                                    ) : (
                                      <>
                                        <Pencil className="h-4 w-4 mr-1" /> Edit
                                      </>
                                    )}
                                  </Button>
                                </Link>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {recentUploads.map((upload) => (
                  <VideoCard 
                    key={upload.id} 
                    id={upload.id}
                    title={upload.title}
                    thumbnailUrl={upload.thumbnailUrl}
                    status={upload.status}
                    createdAt={upload.createdAt}
                  />
                ))}
              </div>
            )}
          </div>
        ) : null}
        
        <Card>
          <CardHeader>
            <CardTitle>Tips for Best Results</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 list-disc pl-5">
              <li>Use clear, legible fonts in your presentations</li>
              <li>Include descriptive titles and headings on each slide</li>
              <li>Limit each slide to one main concept or idea</li>
              <li>Include speaker notes if you want to guide the AI narration</li>
              <li>Maximum file size is 100MB</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Upload;
