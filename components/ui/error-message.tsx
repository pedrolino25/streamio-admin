/**
 * ErrorMessage Component
 *
 * Reusable error message display component following Composition Pattern.
 */

import { cn } from "@/lib/utils";
import { XCircle } from "lucide-react";

interface ErrorMessageProps {
  message: string;
  className?: string;
  role?: string;
}

export function ErrorMessage({ message, className, role = "alert" }: ErrorMessageProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive",
        className
      )}
      role={role}
      aria-live="assertive"
    >
      <XCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}
