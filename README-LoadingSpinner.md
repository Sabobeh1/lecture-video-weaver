# Enhanced Loading Spinner Component

## Overview

The Enhanced Loading Spinner Component is a comprehensive loading solution that provides continuous visual feedback for asynchronous operations. It replaces static loading indicators with an animated spinner that persists until backend responses arrive, improving perceived performance and user confidence.

## Features

### ✅ PRD Requirements Compliance

- **64×64px spinner** with primary brand blue (#0055FF)
- **50% opacity backdrop** for proper visual hierarchy
- **CSS animations running at 60fps** without jank
- **Initial render time < 50ms** for optimal performance
- **WCAG 2.1 AA accessibility compliance**
- **Analytics tracking** for operations >5s
- **Cancellation support** for long-running operations
- **Error handling** with retry functionality

### 🎨 Design Specifications

- **Dimension**: 64×64px (customizable)
- **Color**: Primary brand blue (#0055FF) with custom color support
- **Animation**: CSS keyframes rotating 360° every 1s with dash animation
- **Backdrop**: Semi-transparent overlay with blur effect

### ♿ Accessibility Features

- `role="status"` and `aria-live="polite"` attributes
- Hidden descriptive text for screen readers
- Proper ARIA labeling
- Keyboard navigation support
- WCAG 2.1 AA compliant contrast ratios

## Components

### 1. LoadingSpinner Component

#### Basic Usage

```tsx
import { LoadingSpinner } from '@/components/ui/loading-spinner';

// Basic spinner with backdrop
<LoadingSpinner message="Loading content..." />

// Inline spinner without backdrop
<LoadingSpinner 
  showBackdrop={false}
  size={32}
  message="Loading..."
/>

// Error state with retry
<LoadingSpinner 
  isError={true}
  error="Something went wrong!"
  showRetry={true}
  onRetry={handleRetry}
/>

// With cancellation support
<LoadingSpinner 
  message="Processing..."
  showCancel={true}
  onCancel={handleCancel}
/>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `size` | `number` | `64` | Size of the spinner in pixels |
| `showBackdrop` | `boolean` | `true` | Whether to show the backdrop overlay |
| `message` | `string` | `"Loading content..."` | Loading message to display |
| `showCancel` | `boolean` | `false` | Whether to show a cancel button |
| `onCancel` | `() => void` | `undefined` | Callback when cancel is clicked |
| `showRetry` | `boolean` | `false` | Whether to show retry button on error |
| `onRetry` | `() => void` | `undefined` | Callback when retry is clicked |
| `error` | `string` | `undefined` | Error message to display |
| `isError` | `boolean` | `false` | Whether the spinner is in error state |
| `color` | `string` | `"#0055FF"` | Custom spinner color |
| `className` | `string` | `undefined` | Additional CSS classes |

### 2. useLoadingSpinner Hook

#### Usage

```tsx
import { useLoadingSpinner } from '@/hooks/useLoadingSpinner';

function MyComponent() {
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
    defaultMessage: "Processing...",
    onCancel: () => console.log("Cancelled"),
    enableAnalytics: true
  });

  // Simple loading control
  const handleStart = () => startLoading("Custom message...");
  const handleStop = () => stopLoading();

  // Wrapper for async operations
  const handleAsyncOperation = async () => {
    try {
      await withLoading(async (signal) => {
        updateMessage("Step 1: Initializing...");
        await step1();
        
        updateMessage("Step 2: Processing...");
        await step2();
        
        return result;
      }, "Starting operation...");
    } catch (error) {
      // Error handling is automatic
    }
  };

  return (
    <>
      <button onClick={handleAsyncOperation}>Start Operation</button>
      
      {isLoading && (
        <LoadingSpinner 
          message={message}
          showCancel={true}
          onCancel={cancel}
        />
      )}
      
      {error && (
        <LoadingSpinner 
          isError={true}
          error={error}
          showRetry={true}
          onRetry={() => {
            clearError();
            handleAsyncOperation();
          }}
        />
      )}
    </>
  );
}
```

#### Hook API

| Method | Description |
|--------|-------------|
| `startLoading(message?)` | Start loading with optional message |
| `stopLoading()` | Stop loading state |
| `setError(error)` | Set error state |
| `clearError()` | Clear error state |
| `cancel()` | Cancel operation and reset state |
| `updateMessage(message)` | Update loading message |
| `withLoading(operation, message?)` | Wrapper for async operations |

| State | Type | Description |
|-------|------|-------------|
| `isLoading` | `boolean` | Current loading state |
| `error` | `string \| null` | Current error message |
| `message` | `string` | Current loading message |
| `abortSignal` | `AbortSignal?` | Signal for cancelling operations |

## Integration Examples

### 1. Video Upload Integration

```tsx
// Enhanced VideoUploader with new loading spinner
const uploadVideo = async (file: File) => {
  try {
    await withLoading(async (signal) => {
      updateMessage("Preparing file...");
      await prepareFile(file);
      
      updateMessage("Uploading to server...");
      await uploadFile(file, signal);
      
      updateMessage("Processing video...");
      await processVideo();
      
      return videoResult;
    }, "Starting video upload...");
    
    toast.success("Video uploaded successfully!");
  } catch (error) {
    // Error handling is automatic
  }
};
```

### 2. Form Submission

```tsx
const handleSubmit = async (data: FormData) => {
  try {
    await withLoading(async () => {
      const result = await submitForm(data);
      return result;
    }, "Submitting form...");
    
    toast.success("Form submitted successfully!");
  } catch (error) {
    toast.error("Submission failed");
  }
};
```

### 3. Data Fetching

```tsx
const loadData = async () => {
  try {
    const data = await withLoading(async (signal) => {
      updateMessage("Fetching user data...");
      const users = await fetchUsers(signal);
      
      updateMessage("Fetching settings...");
      const settings = await fetchSettings(signal);
      
      return { users, settings };
    }, "Loading dashboard...");
    
    setData(data);
  } catch (error) {
    // Error is automatically handled by the hook
  }
};
```

## Performance Optimizations

### 1. 60fps Animation
- Uses SVG with CSS transforms for optimal performance
- Hardware-accelerated animations via `transform` property
- Efficient keyframe animations with minimal repaints

### 2. Memory Management
- Automatic cleanup of intervals and timers
- Proper disposal of AbortControllers
- Optimized re-renders with React.memo patterns

### 3. Bundle Size
- Tree-shakeable components
- Minimal dependencies
- Efficient CSS-in-JS alternative with utility classes

## Analytics & Monitoring

### 1. Built-in Analytics
```typescript
// Long-running operation detection (>5s)
console.log('[LoadingSpinner Analytics] Long-running operation detected', {
  duration: 6,
  message: "Processing video...",
  timestamp: "2025-01-16T10:30:00.000Z"
});

// Operation completion logging
console.log('[LoadingSpinner Analytics] Loading completed', {
  duration: 3,
  message: "Upload complete",
  timestamp: "2025-01-16T10:30:03.000Z"
});
```

### 2. Performance Metrics
- Initial render time tracking
- Animation performance monitoring
- Memory usage optimization
- Operation duration logging

## Browser Support

### Modern Browsers
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

### Features Used
- CSS Transforms and Animations
- Intersection Observer API
- AbortController API
- CSS Grid and Flexbox

## Migration Guide

### From Existing Loaders

```tsx
// Before: Basic Loader2 usage
{isLoading && <Loader2 className="animate-spin" />}

// After: Enhanced LoadingSpinner
{isLoading && (
  <LoadingSpinner 
    message="Loading..."
    showCancel={true}
    onCancel={handleCancel}
  />
)}
```

### From Custom Loading States

```tsx
// Before: Manual state management
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

// After: Use the hook
const { isLoading, error, withLoading } = useLoadingSpinner();

// Automatic state management with withLoading wrapper
```

## Demo Page

Visit `/loading-demo` in the application to see all features in action:

- Basic loading spinner with backdrop
- Error states with retry functionality
- Inline spinners without backdrop
- Size and color variations
- Accessibility features demonstration
- Performance characteristics
- Analytics logging

## Best Practices

### 1. User Experience
- Use descriptive loading messages
- Provide cancellation for long operations (>5s)
- Show progress updates when possible
- Handle errors gracefully with retry options

### 2. Performance
- Use `showBackdrop={false}` for inline loaders
- Avoid nested loading states
- Implement proper cleanup in useEffect hooks
- Use AbortController for cancellable requests

### 3. Accessibility
- Always provide meaningful loading messages
- Test with screen readers
- Ensure keyboard navigation works
- Maintain focus management

### 4. Analytics
- Monitor loading duration metrics
- Track cancellation rates
- Identify slow operations
- Optimize based on user behavior

## Troubleshooting

### Common Issues

1. **Spinner not showing**: Check that `isLoading` state is properly managed
2. **Animation performance**: Ensure GPU acceleration is enabled
3. **Memory leaks**: Always cleanup timers and AbortControllers
4. **Accessibility warnings**: Verify ARIA attributes are properly set

### Performance Issues

1. **Slow initial render**: Check component tree depth
2. **Janky animations**: Reduce concurrent animations
3. **High memory usage**: Implement proper cleanup patterns 