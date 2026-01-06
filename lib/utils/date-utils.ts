export function formatDate(dateString?: string): string {
  if (!dateString) return "—";
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

function formatDurationFromMs(diffMs: number): string {
  if (diffMs < 0) return "—";

  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts: string[] = [];
  if (hours > 0) {
    parts.push(`${hours} h`);
  }
  if (minutes > 0) {
    parts.push(`${minutes} min`);
  }
  if (seconds > 0 && hours === 0) {
    // Only show seconds if less than an hour
    parts.push(`${seconds} sec`);
  }

  return parts.length > 0 ? parts.join(" ") : "0 sec";
}

export function formatProcessingDuration(
  startTimestamp?: string,
  endTimestamp?: string
): string {
  if (!startTimestamp || !endTimestamp) return "—";
  try {
    const start = new Date(startTimestamp).getTime();
    const end = new Date(endTimestamp).getTime();
    const diffMs = end - start;
    return formatDurationFromMs(diffMs);
  } catch {
    return "—";
  }
}

export function formatElapsedProcessingTime(
  startTimestamp?: string
): string {
  if (!startTimestamp) return "—";
  try {
    const start = new Date(startTimestamp).getTime();
    const now = Date.now();
    const diffMs = now - start;
    return formatDurationFromMs(diffMs);
  } catch {
    return "—";
  }
}
