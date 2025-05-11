
import { cn } from "@/lib/utils";
import { UploadStatus } from "@/types/upload";
import { Loader } from "lucide-react";

interface StatusBadgeProps {
  status: UploadStatus;
  className?: string;
  isUploading?: boolean;
}

const statusConfig = {
  pending: {
    label: "Pending",
    className: "bg-gray-100 text-gray-800",
  },
  processing: {
    label: "Processing",
    className: "bg-blue-100 text-blue-800",
  },
  completed: {
    label: "Completed",
    className: "bg-green-100 text-green-800",
  },
  error: {
    label: "Error",
    className: "bg-red-100 text-red-800",
  },
};

export function StatusBadge({ status, className, isUploading }: StatusBadgeProps) {
  const config = statusConfig[status];

  if (isUploading) {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-800",
          className
        )}
      >
        <Loader size={10} className="animate-spin mr-1" />
        Uploading
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
