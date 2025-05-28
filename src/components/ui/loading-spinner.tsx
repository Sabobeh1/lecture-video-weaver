import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

interface LoadingSpinnerProps {
  /** Size of the spinner in pixels (default: 64) */
  size?: number;
  /** Whether to show the backdrop overlay */
  showBackdrop?: boolean;
  /** Loading message to display */
  message?: string;
  /** Whether to show a cancel button */
  showCancel?: boolean;
  /** Callback when cancel is clicked */
  onCancel?: () => void;
  /** Whether to show retry button on error */
  showRetry?: boolean;
  /** Callback when retry is clicked */
  onRetry?: () => void;
  /** Error message to display */
  error?: string;
  /** Additional className for the container */
  className?: string;
  /** Whether the spinner is in error state */
  isError?: boolean;
  /** Custom spinner color (default: primary brand blue) */
  color?: string;
}

const LoadingSpinner = React.forwardRef<HTMLDivElement, LoadingSpinnerProps>(
  ({
    size = 64,
    showBackdrop = true,
    message = "Loading content...",
    showCancel = false,
    onCancel,
    showRetry = false,
    onRetry,
    error,
    className,
    isError = false,
    color = "#0055FF",
    ...props
  }, ref) => {
    const [displayDuration, setDisplayDuration] = React.useState(0);
    const startTimeRef = React.useRef<number>(Date.now());
    const intervalRef = React.useRef<NodeJS.Timeout>();

    // Track display duration for analytics
    React.useEffect(() => {
      startTimeRef.current = Date.now();
      
      intervalRef.current = setInterval(() => {
        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setDisplayDuration(duration);
        
        // Log analytics event for long-running operations (>5s)
        if (duration === 5) {
          console.log('[LoadingSpinner Analytics] Long-running operation detected', {
            duration,
            message,
            timestamp: new Date().toISOString()
          });
          
          // In a real implementation, you would send this to your analytics service
          // analytics.track('long_loading_operation', { duration, message });
        }
      }, 1000);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        
        // Log final duration when component unmounts
        const finalDuration = Math.floor((Date.now() - startTimeRef.current) / 1000);
        if (finalDuration > 0) {
          console.log('[LoadingSpinner Analytics] Loading completed', {
            duration: finalDuration,
            message,
            timestamp: new Date().toISOString()
          });
        }
      };
    }, [message]);

    const spinnerElement = (
      <div
        className="relative"
        style={{ width: size, height: size }}
        role="status"
        aria-live="polite"
        aria-label={message}
      >
        {/* Spinner SVG for optimal 60fps performance */}
        <svg
          className="animate-spin"
          style={{
            width: size,
            height: size,
            animation: 'spin 1s linear infinite'
          }}
          viewBox="0 0 50 50"
        >
          <circle
            cx="25"
            cy="25"
            r="20"
            fill="none"
            stroke={isError ? "#ef4444" : color}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="31.416"
            strokeDashoffset="31.416"
            className="spinner-dash"
          />
        </svg>
        
        {/* Screen reader only text */}
        <span className="sr-only">{message}</span>
      </div>
    );

    const content = (
      <div className="flex flex-col items-center justify-center space-y-4">
        {!isError && spinnerElement}
        
        {isError && error && (
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-100">
            <X className="w-8 h-8 text-red-600" />
          </div>
        )}
        
        <div className="text-center space-y-2">
          <p className="text-lg font-medium text-gray-900">
            {isError ? "Something went wrong" : message}
          </p>
          
          {isError && error && (
            <p className="text-sm text-red-600 max-w-md">{error}</p>
          )}
          
          {!isError && displayDuration > 3 && (
            <p className="text-sm text-gray-500">
              This is taking longer than usual...
            </p>
          )}
        </div>
        
        <div className="flex gap-2">
          {showCancel && onCancel && (
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          
          {isError && showRetry && onRetry && (
            <Button onClick={onRetry}>
              Try Again
            </Button>
          )}
        </div>
      </div>
    );

    if (!showBackdrop) {
      return (
        <div ref={ref} className={cn("flex items-center justify-center", className)} {...props}>
          {content}
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(
          "fixed inset-0 z-50 flex items-center justify-center",
          "bg-black/50 backdrop-blur-sm",
          className
        )}
        {...props}
      >
        <div className="bg-white rounded-lg p-8 shadow-lg max-w-md mx-4">
          {content}
        </div>
      </div>
    );
  }
);

LoadingSpinner.displayName = "LoadingSpinner";

export { LoadingSpinner };
export type { LoadingSpinnerProps }; 