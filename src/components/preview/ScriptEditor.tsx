
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";
import { Edit, Check, X } from "lucide-react";

interface ScriptEditorProps {
  slideNumber: number;
  initialScript: string;
  onSave: (slideNumber: number, script: string) => Promise<void>;
}

export function ScriptEditor({ slideNumber, initialScript, onSave }: ScriptEditorProps) {
  const [script, setScript] = useState(initialScript);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(slideNumber, script);
      setIsEditing(false);
      toast.success("Script saved successfully");
    } catch (error) {
      toast.error("Failed to save script");
      console.error("Failed to save script:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setScript(initialScript);
    setIsEditing(false);
  };

  return (
    <Card className="p-4 mb-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-medium">Slide {slideNumber}</h3>
        {isEditing ? (
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleCancel}
              disabled={isSaving}
            >
              <X size={16} className="mr-1" /> Cancel
            </Button>
            <Button 
              size="sm" 
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : (
                <>
                  <Check size={16} className="mr-1" /> Save
                </>
              )}
            </Button>
          </div>
        ) : (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsEditing(true)}
          >
            <Edit size={16} className="mr-1" /> Edit Script
          </Button>
        )}
      </div>

      {isEditing ? (
        <Textarea
          value={script}
          onChange={(e) => setScript(e.target.value)}
          className="min-h-[120px]"
          placeholder="Enter script for this slide..."
        />
      ) : (
        <div className="text-gray-700 whitespace-pre-wrap">{script}</div>
      )}
    </Card>
  );
}
