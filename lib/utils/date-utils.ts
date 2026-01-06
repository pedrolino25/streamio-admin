import { format, intervalToDuration } from "date-fns";

export function formatDate(dateString?: string): string {
  if (!dateString) return "—";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "—";
    return format(date, "MMM d, yyyy 'at' h:mm a");
  } catch {
    return "—";
  }
}

function formatDurationFromMs(diffMs: number): string {
  if (diffMs < 0) return "—";

  const duration = intervalToDuration({ start: 0, end: diffMs });
  const parts: string[] = [];

  if (duration.hours && duration.hours > 0) {
    parts.push(`${duration.hours} h`);
  }
  if (duration.minutes && duration.minutes > 0) {
    parts.push(`${duration.minutes} min`);
  }
  if (duration.seconds && duration.seconds > 0 && !duration.hours) {
    parts.push(`${duration.seconds} sec`);
  }

  return parts.length > 0 ? parts.join(" ") : "0 sec";
}

export function formatProcessingDuration(
  startTimestamp?: string,
  endTimestamp?: string
): string {
  if (!startTimestamp || !endTimestamp) return "—";
  try {
    const start = new Date(startTimestamp);
    const end = new Date(endTimestamp);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) return "—";

    const diffMs = end.getTime() - start.getTime();
    return formatDurationFromMs(diffMs);
  } catch {
    return "—";
  }
}

export function formatElapsedProcessingTime(startTimestamp?: string): string {
  if (!startTimestamp) return "—";
  try {
    const start = new Date(startTimestamp);
    if (isNaN(start.getTime())) return "—";

    const now = Date.now();
    const diffMs = now - start.getTime();
    return formatDurationFromMs(diffMs);
  } catch {
    return "—";
  }
}
