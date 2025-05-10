
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { ScriptEditor } from "@/components/preview/ScriptEditor";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { toast } from "@/components/ui/sonner";
import { Loader2, Play, Edit } from "lucide-react";

// Mock data for demonstration
const mockSlides = [
  {
    id: 1,
    imageUrl: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&w=500",
    title: "Introduction to Machine Learning",
    script: "Welcome to this lecture on Machine Learning fundamentals. In this course, we will cover supervised and unsupervised learning techniques, as well as practical applications in various industries.",
  },
  {
    id: 2,
    imageUrl: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&w=500",
    title: "What is Machine Learning?",
    script: "Machine Learning is a subset of artificial intelligence that focuses on building systems that learn from and make decisions based on data. Unlike traditional programming, where explicit instructions are provided, machine learning algorithms identify patterns and make predictions with minimal human intervention.",
  },
  {
    id: 3,
    imageUrl: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&w=500",
    title: "Types of Machine Learning",
    script: "There are three main types of machine learning: supervised learning, unsupervised learning, and reinforcement learning. Supervised learning uses labeled training data to make predictions or decisions. Unsupervised learning identifies patterns in unlabeled data. Reinforcement learning trains algorithms through trial and error using rewards and penalties.",
  },
];

const Preview = () => {
  const { id } = useParams<{ id: string }>();
  const [slides, setSlides] = useState(mockSlides);
  const [activeSlide, setActiveSlide] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    // Simulate loading data based on ID
    console.log(`Loading preview data for ID: ${id}`);
  }, [id]);

  const handleSaveScript = async (slideNumber: number, script: string) => {
    // Simulate API call to save the script
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        setSlides((prevSlides) =>
          prevSlides.map((slide) =>
            slide.id === slideNumber ? { ...slide, script } : slide
          )
        );
        resolve();
      }, 500);
    });
  };

  const handleGenerateVideo = () => {
    setIsGenerating(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsGenerating(false);
      toast.success("Video generation started! You will be notified when it's ready.");
    }, 2000);
  };

  const currentSlide = slides.find((slide) => slide.id === activeSlide);
  
  // Fix: Use a different approach to handle tab switching
  const handleEditButtonClick = () => {
    // Get the edit tab trigger element
    const editTabTrigger = document.querySelector('[data-value="edit"]') as HTMLElement | null;
    // If found, trigger a click on it
    if (editTabTrigger && 'click' in editTabTrigger) {
      editTabTrigger.click();
    }
  };

  return (
    <AppLayout title="Preview & Edit" subtitle="Review and edit your lecture script">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Slide thumbnails */}
        <Card className="lg:col-span-1 overflow-hidden">
          <div className="p-4 border-b bg-gray-50">
            <h3 className="font-medium">Slides</h3>
          </div>
          <CardContent className="p-0">
            <div className="overflow-auto max-h-[70vh]">
              {slides.map((slide) => (
                <div
                  key={slide.id}
                  className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                    activeSlide === slide.id ? "bg-gray-100" : ""
                  }`}
                  onClick={() => setActiveSlide(slide.id)}
                >
                  <div className="flex gap-4 items-center">
                    <div className="w-24 h-16 overflow-hidden rounded bg-gray-200 flex-shrink-0">
                      {slide.imageUrl ? (
                        <img
                          src={slide.imageUrl}
                          alt={`Slide ${slide.id}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          No Image
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{slide.title}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Slide {slide.id}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Preview and script editor */}
        <Card className="lg:col-span-2">
          <Tabs defaultValue="preview">
            <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
              <TabsList>
                <TabsTrigger value="preview">Preview</TabsTrigger>
                <TabsTrigger value="edit">Edit Script</TabsTrigger>
              </TabsList>
              
              <Button
                onClick={handleGenerateVideo}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Generate Video
                  </>
                )}
              </Button>
            </div>
            
            <CardContent className="p-6">
              {currentSlide ? (
                <>
                  <TabsContent value="preview" className="space-y-6 mt-0">
                    <div className="bg-white rounded-lg border overflow-hidden">
                      {currentSlide.imageUrl ? (
                        <img
                          src={currentSlide.imageUrl}
                          alt={`Slide ${currentSlide.id}`}
                          className="w-full aspect-video object-contain bg-gray-100"
                        />
                      ) : (
                        <div className="w-full aspect-video flex items-center justify-center bg-gray-100 text-gray-400">
                          No Preview Available
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium">{currentSlide.title}</h3>
                        <Button
                          variant="ghost" 
                          size="sm"
                          onClick={handleEditButtonClick}
                        >
                          <Edit size={16} className="mr-1" />
                          Edit Script
                        </Button>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg border">
                        <p className="text-gray-700">{currentSlide.script}</p>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="edit" className="space-y-4 mt-0">
                    <ScriptEditor
                      slideNumber={currentSlide.id}
                      initialScript={currentSlide.script}
                      onSave={handleSaveScript}
                    />
                    
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <h4 className="font-medium text-amber-800 mb-2">Editing Tips</h4>
                      <ul className="list-disc pl-5 text-sm text-amber-700 space-y-1">
                        <li>Keep sentences clear and concise</li>
                        <li>Use natural language for better speech synthesis</li>
                        <li>Add phonetic spelling for technical terms in [brackets]</li>
                        <li>Use punctuation to control pacing</li>
                      </ul>
                    </div>
                  </TabsContent>
                </>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">No slide selected</p>
                </div>
              )}
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Preview;
