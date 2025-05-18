
import { AppLayout } from "@/components/layout/AppLayout";
import { VideoUploader } from "@/components/upload/VideoUploader";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileUploader } from "@/components/upload/FileUploader";

const Upload = () => {
  return (
    <AppLayout title="Upload" subtitle="Upload lecture slides and generate videos">
      <Card>
        <Tabs defaultValue="video" className="w-full">
          <TabsList className="grid grid-cols-2 m-4">
            <TabsTrigger value="video">Video Generation</TabsTrigger>
            <TabsTrigger value="files">File Management</TabsTrigger>
          </TabsList>

          <CardContent className="p-6">
            <TabsContent value="video" className="mt-0">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-2">Generate Video from PDF</h3>
                  <p className="text-gray-500 mb-4">
                    Upload PDF slides to automatically generate a lecture video with AI narration.
                  </p>
                </div>
                
                <VideoUploader />
              </div>
            </TabsContent>
            
            <TabsContent value="files" className="mt-0">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-2">Upload Files</h3>
                  <p className="text-gray-500">
                    Upload course materials, presentations, or supplementary documents.
                  </p>
                </div>
                
                <FileUploader />
              </div>
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </AppLayout>
  );
};

export default Upload;
