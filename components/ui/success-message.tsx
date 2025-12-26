/**
 * SuccessMessage Component
 *
 * Reusable success message display component following Composition Pattern.
 */

import { cn } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";

interface SuccessMessageProps {
  message: string;
  details?: string;
  className?: string;
}

export function SuccessMessage({
  message,
  details,
  className,
}: SuccessMessageProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-md bg-green-50 p-3 text-sm text-green-700",
        className
      )}
    >
      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="flex-1">
        <p className="font-medium">{message}</p>
        {details && (
          <p className="mt-1 text-xs text-muted-foreground">{details}</p>
        )}
      </div>
    </div>
  );
}
