
import { toast } from "sonner";

// Config should be loaded from import.meta.env instead of process.env
const SSH_CONFIG = {
  host: import.meta.env.VITE_SSH_HOST || "176.119.254.185",
  port: Number(import.meta.env.VITE_SSH_PORT) || 22,
  username: import.meta.env.VITE_SSH_USER || "sabobeh",
  targetDir: import.meta.env.VITE_SSH_TARGET_DIR || "/sabobeh/FileFromUser"
};

export type SSHTransferStatus = "idle" | "pending" | "transferring" | "completed" | "error";

export interface SSHTransferProgress {
  status: SSHTransferStatus;
  progress: number; // 0-100
  attempt: number;
  error?: string;
}

/**
 * IMPORTANT: Browser Limitation Notice
 * Due to security restrictions, browsers cannot directly connect to SSH servers.
 * This function is a placeholder that shows how to integrate with a backend API service.
 * In production, you MUST implement a backend service (like Firebase Cloud Functions, Express server, etc.)
 * that handles the actual SSH transfer.
 */
export const transferFileToSSH = async (
  fileUrl: string,
  fileName: string,
  onProgress?: (progress: SSHTransferProgress) => void
): Promise<boolean> => {
  // In development mode only - simulate the transfer
  if (import.meta.env.DEV) {
    return simulateSSHTransfer(fileUrl, fileName, onProgress);
  }
  
  // In production - call the real backend API
  try {
    if (onProgress) {
      onProgress({
        status: "pending",
        progress: 0,
        attempt: 1
      });
    }
    
    // This is where you would call your actual backend API
    const result = await callSSHTransferAPI(fileUrl, fileName);
    
    if (result.success) {
      if (onProgress) {
        onProgress({
          status: "completed",
          progress: 100,
          attempt: 1
        });
      }
      return true;
    } else {
      if (onProgress) {
        onProgress({
          status: "error",
          progress: 0,
          attempt: 1,
          error: result.error || "Transfer failed"
        });
      }
      toast.error("Failed to transfer file to SSH server");
      return false;
    }
  } catch (error) {
    console.error("SSH transfer error:", error);
    if (onProgress) {
      onProgress({
        status: "error",
        progress: 0,
        attempt: 1,
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
    toast.error("Error connecting to SSH transfer service");
    return false;
  }
};

// Simulation function for development testing
const simulateSSHTransfer = async (
  fileUrl: string,
  fileName: string,
  onProgress?: (progress: SSHTransferProgress) => void
): Promise<boolean> => {
  let attempt = 1;
  const maxAttempts = 3;
  const backoffDelay = 1000; // Starting delay in ms
  
  while (attempt <= maxAttempts) {
    try {
      if (onProgress) {
        onProgress({
          status: "transferring",
          progress: 0,
          attempt
        });
      }
      
      // Simulate progress in chunks
      for (let progress = 0; progress <= 100; progress += 10) {
        if (onProgress) {
          onProgress({
            status: "transferring",
            progress,
            attempt
          });
        }
        
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Randomly fail on first attempts to test retry logic
        if (attempt < maxAttempts && progress > 50 && Math.random() < 0.3) {
          throw new Error("Simulated network failure");
        }
      }
      
      console.log(`[DEV SIMULATION] SSH Transfer would send: ${fileName} to ${SSH_CONFIG.host}:${SSH_CONFIG.targetDir}`);
      
      if (onProgress) {
        onProgress({
          status: "completed",
          progress: 100,
          attempt
        });
      }
      
      return true;
      
    } catch (error) {
      console.error(`SSH Transfer simulation failed (attempt ${attempt}/${maxAttempts}):`, error);
      
      if (onProgress) {
        onProgress({
          status: "error",
          progress: 0,
          attempt,
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
      
      if (attempt >= maxAttempts) {
        toast.error(`Failed to archive file after ${maxAttempts} attempts`);
        return false;
      }
      
      const delay = backoffDelay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
      attempt++;
    }
  }
  
  return false;
};

/**
 * This is the function that would call your actual backend API
 * You need to implement a backend service (Firebase Function, Express server, etc.)
 * that handles the SSH connection and file transfer.
 */
export const callSSHTransferAPI = async (fileUrl: string, fileName: string) => {
  try {
    // 1. fetch the blob the user just picked
    const response = await fetch(fileUrl);
    const blob = await response.blob();
    
    // Create a FormData object to send the file
    const formData = new FormData();
    formData.append('file', new File([blob], fileName, { type: blob.type }));
    
    // 2. hit your Flask box. Add an env var so you switch automatically per env:
    const apiUrl = import.meta.env.VITE_API_URL ?? "http://176.119.254.185:8000/api/upload";
    
    // Make the API call to your backend service
    const res = await fetch(apiUrl, {
      method: 'POST',
      body: formData,
      credentials: "include",
    });
    
    if (!res.ok) {
      throw new Error(`Upload failed: ${res.statusText}`);
    }
    
    return await res.json(); // { success: true, public_url: "...", ... }
  } catch (error) {
    console.error('SSH transfer API error:', error);
    throw error;
  }
};
