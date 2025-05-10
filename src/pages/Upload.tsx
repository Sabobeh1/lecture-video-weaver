
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { FileUploader } from "@/components/upload/FileUploader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { VideoCard } from "@/components/dashboard/VideoCard";

// Mock data for demonstration
const recentUploads = [
  {
    id: "3",
    title: "Web Development Fundamentals",
    thumbnailUrl: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&w=500",
    status: "pending" as const,
    createdAt: "2025-05-08T09:15:00Z",
  },
  {
    id: "2",
    title: "Advanced Data Structures",
    thumbnailUrl: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&w=500",
    status: "processing" as const,
    createdAt: "2025-05-01T15:20:00Z",
  },
];

const Upload = () => {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileSelected = (file: File) => {
    setSelectedFile(file);
  };

  const handleSubmit = () => {
    if (!selectedFile) return;
    
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      toast.success("Slides uploaded successfully!");
      navigate("/preview/new-upload-id");
    }, 1500);
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
            <FileUploader onFileSelected={handleFileSelected} />
            
            {selectedFile && (
              <div className="flex justify-end">
                <Button 
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Processing..." : "Generate Video"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        
        {recentUploads.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-heading font-semibold">Recent Uploads</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentUploads.map((upload) => (
                <VideoCard key={upload.id} {...upload} />
              ))}
            </div>
          </div>
        )}
        
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
