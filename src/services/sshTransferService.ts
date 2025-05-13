import { toast } from "sonner";

// Config should be loaded from environment variables
const SSH_CONFIG = {
  host: process.env.SSH_HOST || "176.119.254.185",
  port: Number(process.env.SSH_PORT) || 22,
  username: process.env.SSH_USER || "sabobeh",
  targetDir: process.env.SSH_TARGET_DIR || "/sabobeh/FileFromUser#"
};

export type SSHTransferStatus = "idle" | "pending" | "transferring" | "completed" | "error";

export interface SSHTransferProgress {
  status: SSHTransferStatus;
  progress: number; // 0-100
  attempt: number;
  error?: string;
}

/**
 * Initiates an SSH transfer to the configured server
 * Note: This function is a mock implementation as browsers cannot directly connect via SSH
 * In production, this would call a backend API (e.g. Firebase Function) that handles the SSH transfer
 */
export const transferFileToSSH = async (
  fileUrl: string,
  fileName: string,
  onProgress?: (progress: SSHTransferProgress) => void
): Promise<boolean> => {
  // In a real implementation, this would call a backend API endpoint
  // that handles the SSH transfer securely
  
  let attempt = 1;
  const maxAttempts = 3;
  const backoffDelay = 1000; // Starting delay in ms
  
  while (attempt <= maxAttempts) {
    try {
      // Notify of attempt start
      if (onProgress) {
        onProgress({
          status: "transferring",
          progress: 0,
          attempt: attempt
        });
      }
      
      // Simulate transfer progress in chunks
      for (let progress = 0; progress <= 100; progress += 10) {
        if (onProgress) {
          onProgress({
            status: "transferring",
            progress,
            attempt
          });
        }
        
        // Simulate network delays
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Randomly fail on first attempts to test retry logic (only in dev)
        if (process.env.NODE_ENV === 'development' && 
            attempt < maxAttempts && 
            progress > 50 && 
            Math.random() < 0.3) {
          throw new Error("Simulated network failure");
        }
      }
      
      // Success - log and return
      console.log(`SSH Transfer completed: ${fileName} to ${SSH_CONFIG.host}:${SSH_CONFIG.targetDir}`);
      
      if (onProgress) {
        onProgress({
          status: "completed",
          progress: 100,
          attempt
        });
      }
      
      return true;
      
    } catch (error) {
      console.error(`SSH Transfer failed (attempt ${attempt}/${maxAttempts}):`, error);
      
      if (onProgress) {
        onProgress({
          status: "error",
          progress: 0,
          attempt,
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
      
      // If we've reached max attempts, give up
      if (attempt >= maxAttempts) {
        toast.error(`Failed to archive file after ${maxAttempts} attempts`);
        return false;
      }
      
      // Otherwise, wait with exponential backoff before trying again
      const delay = backoffDelay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
      attempt++;
    }
  }
  
  return false;
};

// For future implementation: real SSH transfer via backend API
export const callSSHTransferAPI = async (fileUrl: string, fileName: string) => {
  try {
    // This would be an actual API call to your backend service
    const response = await fetch('/api/ssh-transfer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileUrl,
        fileName,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('SSH transfer API error:', error);
    throw error;
  }
};
