import React, { useState } from 'react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useLoadingSpinner } from '@/hooks/useLoadingSpinner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AppLayout } from '@/components/layout/AppLayout';
import { toast } from 'sonner';

const LoadingSpinnerDemo = () => {
  const [showBasicSpinner, setShowBasicSpinner] = useState(false);
  const [showErrorSpinner, setShowErrorSpinner] = useState(false);
  const [showInlineSpinner, setShowInlineSpinner] = useState(false);

  const {
    isLoading,
    error,
    message,
    startLoading,
    stopLoading,
    setError,
    clearError,
    cancel,
    updateMessage,
    withLoading
  } = useLoadingSpinner({
    defaultMessage: "Processing your request...",
    onCancel: () => {
      toast.info("Operation cancelled by user");
    }
  });

  // Simulate different types of operations
  const simulateQuickOperation = () => {
    setShowBasicSpinner(true);
    setTimeout(() => {
      setShowBasicSpinner(false);
      toast.success("Quick operation completed!");
    }, 2000);
  };

  const simulateLongOperation = async () => {
    try {
      await withLoading(async (signal) => {
        // Simulate a long-running operation with progress updates
        updateMessage("Initializing...");
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (signal.aborted) throw new Error('AbortError');
        
        updateMessage("Processing data...");
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        if (signal.aborted) throw new Error('AbortError');
        
        updateMessage("Finalizing...");
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (signal.aborted) throw new Error('AbortError');
        
        return "Operation completed successfully!";
      }, "Starting long operation...");
      
      toast.success("Long operation completed!");
    } catch (error) {
      if (error instanceof Error && error.message !== 'AbortError') {
        toast.error("Operation failed: " + error.message);
      }
    }
  };

  const simulateErrorOperation = () => {
    setShowErrorSpinner(true);
    setTimeout(() => {
      setShowErrorSpinner(false);
      toast.error("Operation failed!");
    }, 3000);
  };

  const simulateInlineLoading = () => {
    setShowInlineSpinner(true);
    setTimeout(() => {
      setShowInlineSpinner(false);
      toast.success("Inline operation completed!");
    }, 3000);
  };

  const handleRetry = () => {
    clearError();
    simulateLongOperation();
  };

  return (
    <AppLayout 
      title="Loading Spinner Demo" 
      subtitle="Showcase of the enhanced loading spinner component"
    >
      <div className="space-y-8">
        {/* Basic Usage */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Loading Spinner</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              64×64px spinner with primary brand blue (#0055FF) and 50% opacity backdrop.
            </p>
            <div className="flex gap-4">
              <Button onClick={simulateQuickOperation}>
                Show Basic Spinner (2s)
              </Button>
              <Button onClick={simulateLongOperation} disabled={isLoading}>
                Simulate Long Operation (6s+)
              </Button>
              <Button onClick={simulateErrorOperation}>
                Simulate Error
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Advanced Features */}
        <Card>
          <CardHeader>
            <CardTitle>Advanced Features</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Spinner with cancellation support, progress messages, and error handling.
            </p>
            <div className="flex gap-4">
              <Button 
                onClick={() => startLoading("Custom loading message...")}
                disabled={isLoading}
              >
                Start with Custom Message
              </Button>
              <Button onClick={stopLoading} disabled={!isLoading}>
                Stop Loading
              </Button>
              <Button onClick={() => setError("Something went wrong!")} disabled={isLoading}>
                Trigger Error
              </Button>
              <Button onClick={clearError} disabled={!error}>
                Clear Error
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Inline Spinner */}
        <Card>
          <CardHeader>
            <CardTitle>Inline Loading Spinner</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Spinner without backdrop overlay for inline usage.
            </p>
            <div className="flex items-center gap-4">
              <Button onClick={simulateInlineLoading} disabled={showInlineSpinner}>
                Show Inline Spinner
              </Button>
              {showInlineSpinner && (
                <LoadingSpinner 
                  showBackdrop={false}
                  size={32}
                  message="Loading inline..."
                />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Size Variations */}
        <Card>
          <CardHeader>
            <CardTitle>Size Variations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Different spinner sizes for various use cases.
            </p>
            <div className="flex items-center gap-8">
              <div className="text-center">
                <LoadingSpinner showBackdrop={false} size={24} />
                <p className="text-xs mt-2">24px</p>
              </div>
              <div className="text-center">
                <LoadingSpinner showBackdrop={false} size={32} />
                <p className="text-xs mt-2">32px</p>
              </div>
              <div className="text-center">
                <LoadingSpinner showBackdrop={false} size={48} />
                <p className="text-xs mt-2">48px</p>
              </div>
              <div className="text-center">
                <LoadingSpinner showBackdrop={false} size={64} />
                <p className="text-xs mt-2">64px (default)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Color Variations */}
        <Card>
          <CardHeader>
            <CardTitle>Color Variations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Custom color support for different themes.
            </p>
            <div className="flex items-center gap-8">
              <div className="text-center">
                <LoadingSpinner showBackdrop={false} size={48} color="#0055FF" />
                <p className="text-xs mt-2">Primary Blue</p>
              </div>
              <div className="text-center">
                <LoadingSpinner showBackdrop={false} size={48} color="#10b981" />
                <p className="text-xs mt-2">Green</p>
              </div>
              <div className="text-center">
                <LoadingSpinner showBackdrop={false} size={48} color="#f59e0b" />
                <p className="text-xs mt-2">Orange</p>
              </div>
              <div className="text-center">
                <LoadingSpinner showBackdrop={false} size={48} color="#6366f1" />
                <p className="text-xs mt-2">Purple</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Accessibility Demo */}
        <Card>
          <CardHeader>
            <CardTitle>Accessibility Features</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Screen reader support with role="status" and aria-live="polite".
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm font-medium mb-2">Accessibility Features:</p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• WCAG 2.1 AA compliant</li>
                <li>• Screen reader announcements</li>
                <li>• Hidden descriptive text for assistive technology</li>
                <li>• Proper ARIA roles and live regions</li>
                <li>• Keyboard navigation support</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Analytics Info */}
        <Card>
          <CardHeader>
            <CardTitle>Analytics & Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Built-in analytics tracking and performance monitoring.
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm font-medium mb-2">Performance Features:</p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 60fps smooth animation with SVG and CSS</li>
                <li>• Initial render time &lt; 50ms</li>
                <li>• Analytics tracking for operations &gt; 5s</li>
                <li>• Operation duration logging</li>
                <li>• Memory-efficient cleanup</li>
              </ul>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Check browser console for analytics logs during long operations.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Full-screen spinners */}
      {showBasicSpinner && (
        <LoadingSpinner 
          message="Processing your request..."
          showCancel={true}
          onCancel={() => setShowBasicSpinner(false)}
        />
      )}

      {showErrorSpinner && (
        <LoadingSpinner 
          message="Processing failed"
          isError={true}
          error="Network connection failed. Please check your internet connection and try again."
          showRetry={true}
          onRetry={() => {
            setShowErrorSpinner(false);
            toast.info("Retrying operation...");
          }}
        />
      )}

      {isLoading && (
        <LoadingSpinner 
          message={message}
          showCancel={true}
          onCancel={cancel}
        />
      )}

      {error && !isLoading && (
        <LoadingSpinner 
          isError={true}
          error={error}
          showRetry={true}
          onRetry={handleRetry}
        />
      )}
    </AppLayout>
  );
};

export default LoadingSpinnerDemo; 