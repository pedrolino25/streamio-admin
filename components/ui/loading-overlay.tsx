/**
 * LoadingOverlay Component
 *
 * Full-screen loading overlay with accessibility support.
 * Provides visual feedback during async operations.
 */

import { LoadingSpinner } from "./loading-spinner";
import { cn } from "@/lib/utils";

interface LoadingOverlayProps {
  message?: string;
  className?: string;
}

export function LoadingOverlay({ message, className }: LoadingOverlayProps) {
  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm",
        className
      )}
      role="status"
      aria-live="polite"
      aria-label={message || "Loading"}
    >
      <div className="flex flex-col items-center gap-4">
        <LoadingSpinner size="lg" />
        {message && (
          <p className="text-sm font-medium text-muted-foreground">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}

