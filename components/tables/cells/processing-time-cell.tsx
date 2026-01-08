"use client";

import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  formatElapsedProcessingTime,
  formatProcessingDuration,
} from "@/lib/utils/date-utils";
import * as React from "react";

interface ProcessingTimeCellProps {
  startTimestamp?: string | number | null;
  endTimestamp?: string | number | null;
}

export function ProcessingTimeCell({
  startTimestamp,
  endTimestamp,
}: ProcessingTimeCellProps) {
  const [, setTick] = React.useState(0);

  React.useEffect(() => {
    if (!startTimestamp || endTimestamp) {
      return;
    }
    const interval = setInterval(() => {
      setTick((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [startTimestamp, endTimestamp]);

  if (!startTimestamp) {
    return <span className="text-muted-foreground">—</span>;
  }

  if (endTimestamp) {
    return (
      <span>{formatProcessingDuration(startTimestamp, endTimestamp)}</span>
    );
  }

  return (
    <span className="flex items-center gap-2">
      <LoadingSpinner size="sm" />
      {formatElapsedProcessingTime(startTimestamp)}
    </span>
  );
}
