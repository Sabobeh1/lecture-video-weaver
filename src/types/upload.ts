
export type UploadStatus = "pending" | "processing" | "completed" | "error";
export type SSHTransferStatus = "idle" | "pending" | "transferring" | "completed" | "error";

export interface Upload {
  id: string;
  userId: string;
  title: string;
  slideUrl: string;
  script?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  status: UploadStatus;
  sshStatus?: SSHTransferStatus;
  sshProgress?: number;
  errorMessage?: string;
  sshErrorMessage?: string;
  createdAt: string;
  updatedAt: string;
}
