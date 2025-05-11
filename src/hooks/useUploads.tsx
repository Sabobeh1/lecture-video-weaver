
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
  Timestamp,
  setDoc
} from "firebase/firestore";
import { 
  ref, 
  uploadBytesResumable, 
  getDownloadURL 
} from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { Upload, UploadStatus } from "@/types/upload";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

export const useUploads = () => {
  const { currentUser } = useAuth();
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!currentUser) {
      setUploads([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    
    // Create a query for uploads belonging to the current user
    const uploadsQuery = query(
      collection(db, "users", currentUser.uid, "uploads"),
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
      const uid = currentUser.uid;
      const uploadId = uuidv4();
      const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
      
      // Validate file type
      if (!['pdf', 'pptx'].includes(fileExt)) {
        toast.error("Only PDF and PPTX files are supported");
        return null;
      }
      
      // Create storage path and reference
      const storagePath = `uploads/${uid}/${uploadId}.${fileExt}`;
      const storageRef = ref(storage, storagePath);
      
      // Use uploadBytesResumable for resumable uploads and progress tracking
      const uploadTask = uploadBytesResumable(storageRef, file);
      
      // Register state_changed observer
      uploadTask.on('state_changed', 
        // Progress observer
        (snapshot) => {
          const progress = Math.floor((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          // Update local state with progress
          setUploadProgress(prev => ({...prev, [uploadId]: progress}));
        },
        // Error observer
        (error) => {
          console.error("Upload error:", error);
          toast.error(`Upload failed: ${error.message}`);
          // Clear progress on error
          setUploadProgress(prev => {
            const newProgress = {...prev};
            delete newProgress[uploadId];
            return newProgress;
          });
        },
        // Completion observer - only create Firestore doc after successful upload
        async () => {
          try {
            // Get download URL once upload is complete
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            
            // Create a new upload document in Firestore
            await setDoc(doc(db, "users", uid, "uploads", uploadId), {
              userId: uid,
              title: title || file.name,
              filename: file.name,
              storagePath,
              fileType: fileExt,
              slideUrl: downloadURL,
              status: "error" as UploadStatus, // Start with error status as per PRD
              errorMessage: "Awaiting AI integration", // Default error message
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
            
            // Clear progress after successful upload and Firestore creation
            setUploadProgress(prev => {
              const newProgress = {...prev};
              delete newProgress[uploadId];
              return newProgress;
            });
            
            toast.success("Slide uploaded successfully");
            return uploadId;
          } catch (err: any) {
            console.error("Error saving to Firestore:", err);
            toast.error(`Failed to save upload metadata: ${err.message}`);
            return null;
          }
        }
      );
      
      // Return the upload ID immediately to enable navigation
      return uploadId;
    } catch (err: any) {
      console.error("Error creating upload:", err);
      toast.error(`Upload failed: ${err.message}`);
      return null;
    }
  };

  const updateUploadStatus = async (uploadId: string, status: UploadStatus, errorMessage?: string): Promise<boolean> => {
    if (!currentUser) return false;
    
    try {
      const uploadRef = doc(db, "users", currentUser.uid, "uploads", uploadId);
      await updateDoc(uploadRef, {
        status,
        ...(errorMessage !== undefined && { errorMessage }),
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
    if (!currentUser) return false;
    
    try {
      const uploadRef = doc(db, "users", currentUser.uid, "uploads", uploadId);
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
    if (!currentUser) return false;
    
    try {
      // Find the upload in our local state first
      const upload = uploads.find(u => u.id === uploadId);
      
      if (!upload) {
        toast.error("Upload not found");
        return false;
      }
      
      // Update the status to pending
      const uploadRef = doc(db, "users", currentUser.uid, "uploads", uploadId);
      await updateDoc(uploadRef, {
        status: "pending" as UploadStatus,
        errorMessage: null,
        updatedAt: serverTimestamp()
      });
      
      toast.success("Processing restarted");
      return true;
    } catch (err) {
      console.error("Error retrying upload:", err);
      toast.error("Failed to retry processing");
      return false;
    }
  };
  
  const downloadSlides = async (uploadId: string): Promise<boolean> => {
    if (!currentUser) return false;
    
    try {
      // Find the upload in our local state
      const upload = uploads.find(u => u.id === uploadId);
      
      if (!upload || !upload.slideUrl) {
        toast.error("Slide file not found");
        return false;
      }
      
      // Trigger download by opening the URL in a new tab
      window.open(upload.slideUrl, '_blank');
      return true;
    } catch (err) {
      console.error("Error downloading slides:", err);
      toast.error("Failed to download slides");
      return false;
    }
  };

  return {
    uploads,
    loading,
    error,
    uploadProgress,
    createUpload,
    updateUploadStatus,
    updateScript,
    retryUpload,
    downloadSlides
  };
};
