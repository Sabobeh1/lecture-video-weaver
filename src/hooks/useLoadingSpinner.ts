import { useState, useCallback, useRef } from 'react';

interface LoadingState {
  isLoading: boolean;
  error: string | null;
  message: string;
}

interface UseLoadingSpinnerOptions {
  defaultMessage?: string;
  onCancel?: () => void;
  enableAnalytics?: boolean;
}

export function useLoadingSpinner(options: UseLoadingSpinnerOptions = {}) {
  const {
    defaultMessage = "Loading content...",
    onCancel,
    enableAnalytics = true
  } = options;

  const [state, setState] = useState<LoadingState>({
    isLoading: false,
    error: null,
    message: defaultMessage
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const startLoading = useCallback((message?: string) => {
    // Create new AbortController for this operation
    abortControllerRef.current = new AbortController();
    
    setState({
      isLoading: true,
      error: null,
      message: message || defaultMessage
    });

    if (enableAnalytics) {
      console.log('[LoadingSpinner] Loading started', {
        message: message || defaultMessage,
        timestamp: new Date().toISOString()
      });
    }
  }, [defaultMessage, enableAnalytics]);

  const stopLoading = useCallback(() => {
    setState(prev => ({
      ...prev,
      isLoading: false
    }));

    if (enableAnalytics) {
      console.log('[LoadingSpinner] Loading completed', {
        timestamp: new Date().toISOString()
      });
    }
  }, [enableAnalytics]);

  const setError = useCallback((error: string) => {
    setState(prev => ({
      ...prev,
      isLoading: false,
      error
    }));

    if (enableAnalytics) {
      console.log('[LoadingSpinner] Loading failed', {
        error,
        timestamp: new Date().toISOString()
      });
    }
  }, [enableAnalytics]);

  const clearError = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: null
    }));
  }, []);

  const cancel = useCallback(() => {
    // Abort any ongoing requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setState({
      isLoading: false,
      error: null,
      message: defaultMessage
    });

    if (onCancel) {
      onCancel();
    }

    if (enableAnalytics) {
      console.log('[LoadingSpinner] Loading cancelled', {
        timestamp: new Date().toISOString()
      });
    }
  }, [defaultMessage, onCancel, enableAnalytics]);

  const updateMessage = useCallback((message: string) => {
    setState(prev => ({
      ...prev,
      message
    }));
  }, []);

  // Wrapper function for async operations
  const withLoading = useCallback(async <T>(
    operation: (signal: AbortSignal) => Promise<T>,
    loadingMessage?: string
  ): Promise<T> => {
    startLoading(loadingMessage);
    
    try {
      const signal = abortControllerRef.current?.signal || new AbortController().signal;
      const result = await operation(signal);
      stopLoading();
      return result;
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          // Operation was cancelled, don't set error
          setState({
            isLoading: false,
            error: null,
            message: defaultMessage
          });
        } else {
          setError(error.message);
        }
      } else {
        setError('An unexpected error occurred');
      }
      throw error;
    }
  }, [startLoading, stopLoading, setError, defaultMessage]);

  return {
    ...state,
    startLoading,
    stopLoading,
    setError,
    clearError,
    cancel,
    updateMessage,
    withLoading,
    abortSignal: abortControllerRef.current?.signal
  };
} 