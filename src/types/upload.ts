
export type UploadStatus = "pending" | "processing" | "completed" | "error";

export interface Upload {
  id: string;
  userId: string;
  title: string;
  slideUrl: string;
  script?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  status: UploadStatus;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}
