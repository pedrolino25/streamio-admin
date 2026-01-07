import { format, intervalToDuration, fromUnixTime } from "date-fns";

export function formatDate(
  dateInput?: string | number | null
): string {
  if (dateInput === undefined || dateInput === null) return "—";
  try {
    let date: Date;
    
    // Handle integer timestamps (Unix timestamp in seconds or milliseconds)
    if (typeof dateInput === "number") {
      // Unix timestamps in seconds are typically 10 digits (dates after 2001)
      // Unix timestamps in milliseconds are typically 13 digits
      // Use 1e12 (1 trillion) as threshold - year 2001 in milliseconds
      const threshold = 1e12; // 1,000,000,000,000
      if (dateInput < threshold) {
        // Timestamp is in seconds, convert using date-fns
        date = fromUnixTime(dateInput);
      } else {
        // Timestamp is in milliseconds
        date = new Date(dateInput);
      }
    } else {
      // Handle string dates (ISO strings, etc.)
      date = new Date(dateInput);
    }
    
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
  startTimestamp?: string | number | null,
  endTimestamp?: string | number | null
): string {
  if (!startTimestamp || !endTimestamp) return "—";
  try {
    const parseTimestamp = (ts: string | number): Date => {
      if (typeof ts === "number") {
        // Unix timestamps in seconds are typically 10 digits
        // Unix timestamps in milliseconds are typically 13 digits
        const threshold = 1e12; // 1,000,000,000,000
        if (ts < threshold) {
          return fromUnixTime(ts);
        }
        return new Date(ts);
      }
      return new Date(ts);
    };

    const start = parseTimestamp(startTimestamp);
    const end = parseTimestamp(endTimestamp);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) return "—";

    const diffMs = end.getTime() - start.getTime();
    return formatDurationFromMs(diffMs);
  } catch {
    return "—";
  }
}

export function formatElapsedProcessingTime(
  startTimestamp?: string | number | null
): string {
  if (startTimestamp === undefined || startTimestamp === null) return "—";
  try {
    let start: Date;
    if (typeof startTimestamp === "number") {
      // Unix timestamps in seconds are typically 10 digits
      // Unix timestamps in milliseconds are typically 13 digits
      const threshold = 1e12; // 1,000,000,000,000
      if (startTimestamp < threshold) {
        start = fromUnixTime(startTimestamp);
      } else {
        start = new Date(startTimestamp);
      }
    } else {
      start = new Date(startTimestamp);
    }
    
    if (isNaN(start.getTime())) return "—";

    const now = Date.now();
    const diffMs = now - start.getTime();
    return formatDurationFromMs(diffMs);
  } catch {
    return "—";
  }
}

export function formatVideoDuration(seconds?: number): string {
  if (seconds === undefined || seconds === null || seconds < 0) return "—";
  try {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  } catch {
    return "—";
  }
}

export function formatFileSize(bytes?: number): string {
  if (bytes === undefined || bytes === null || bytes < 0) return "—";
  try {
    const units = ["B", "KB", "MB", "GB", "TB"];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
  } catch {
    return "—";
  }
}
