
import { AppLayout } from "@/components/layout/AppLayout";
import { FileUploader } from "@/components/upload/FileUploader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useUploads } from "@/hooks/useUploads";
import { VideoCard } from "@/components/dashboard/VideoCard";
import { Skeleton } from "@/components/ui/skeleton";

const Upload = () => {
  const { uploads, loading } = useUploads();
  
  // Get the most recent uploads (limited to 2)
  const recentUploads = uploads.slice(0, 2);

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
        ) : recentUploads.length > 0 ? (
          <div className="space-y-4">
            <h2 className="text-xl font-heading font-semibold">Recent Uploads</h2>
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
