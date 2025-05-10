
import { useState, useEffect } from "react";
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp, 
  Timestamp 
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { Upload, UploadStatus } from "@/types/upload";
import { toast } from "sonner";

export const useUploads = () => {
  const { currentUser } = useAuth();
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!currentUser) {
      setUploads([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    
    // Create a query for uploads belonging to the current user
    const uploadsQuery = query(
      collection(db, "uploads"),
      where("userId", "==", currentUser.uid),
      orderBy("createdAt", "desc")
    );

    // Set up real-time listener for uploads
    const unsubscribe = onSnapshot(
      uploadsQuery,
      (snapshot) => {
        const uploadData = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            // Convert Firestore timestamps to strings
            createdAt: data.createdAt instanceof Timestamp 
              ? data.createdAt.toDate().toISOString() 
              : data.createdAt,
            updatedAt: data.updatedAt instanceof Timestamp 
              ? data.updatedAt.toDate().toISOString() 
              : data.updatedAt,
          } as Upload;
        });
        
        setUploads(uploadData);
        setLoading(false);
      },
      (err) => {
        console.error("Error getting uploads:", err);
        setError(err);
        setLoading(false);
        toast.error("Failed to load your uploads");
      }
    );

    // Clean up listener on unmount
    return () => unsubscribe();
  }, [currentUser]);

  const createUpload = async (file: File, title: string): Promise<string | null> => {
    if (!currentUser) {
      toast.error("You must be logged in to upload files");
      return null;
    }
    
    try {
      // In a real app, we would upload the file to Firebase Storage first
      // and get the download URL. For now, we'll use a placeholder URL
      const slideUrl = URL.createObjectURL(file);
      
      // Create a new upload document in Firestore
      const uploadRef = await addDoc(collection(db, "uploads"), {
        userId: currentUser.uid,
        title: title || file.name,
        slideUrl: slideUrl,
        status: "pending" as UploadStatus,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      toast.success("Upload created successfully");
      return uploadRef.id;
    } catch (err) {
      console.error("Error creating upload:", err);
      toast.error("Failed to create upload");
      return null;
    }
  };

  const updateUploadStatus = async (uploadId: string, status: UploadStatus, errorMessage?: string): Promise<boolean> => {
    try {
      const uploadRef = doc(db, "uploads", uploadId);
      await updateDoc(uploadRef, {
        status,
        ...(errorMessage && { errorMessage }),
        updatedAt: serverTimestamp()
      });
      
      return true;
    } catch (err) {
      console.error("Error updating upload status:", err);
      toast.error("Failed to update upload status");
      return false;
    }
  };

  const updateScript = async (uploadId: string, script: string): Promise<boolean> => {
    try {
      const uploadRef = doc(db, "uploads", uploadId);
      await updateDoc(uploadRef, {
        script,
        updatedAt: serverTimestamp()
      });
      
      toast.success("Script updated successfully");
      return true;
    } catch (err) {
      console.error("Error updating script:", err);
      toast.error("Failed to update script");
      return false;
    }
  };

  const retryUpload = async (uploadId: string): Promise<boolean> => {
    try {
      const uploadRef = doc(db, "uploads", uploadId);
      await updateDoc(uploadRef, {
        status: "pending" as UploadStatus,
        errorMessage: null,
        updatedAt: serverTimestamp()
      });
      
      // In a real application, we would call a backend API to restart processing
      // For example: await fetch(`/api/retry/${uploadId}`);
      
      toast.success("Processing restarted");
      return true;
    } catch (err) {
      console.error("Error retrying upload:", err);
      toast.error("Failed to retry processing");
      return false;
    }
  };

  return {
    uploads,
    loading,
    error,
    createUpload,
    updateUploadStatus,
    updateScript,
    retryUpload
  };
};
