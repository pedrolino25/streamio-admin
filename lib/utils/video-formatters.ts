import { Video } from "@/lib/store/api";

export function formatFileSize(sizeMB?: number): string {
  if (!sizeMB) return "—";
  if (sizeMB < 1) {
    return `${(sizeMB * 1024).toFixed(2)} KB`;
  }
  return `${sizeMB.toFixed(2)} MB`;
}

export function formatVideoTime(seconds?: number): string {
  if (!seconds) return "—";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts: string[] = [];
  if (hours > 0) {
    parts.push(`${hours} h`);
  }
  if (minutes > 0) {
    parts.push(`${minutes} min`);
  }
  if (secs > 0 && hours === 0) {
    parts.push(`${secs} sec`);
  }

  return parts.length > 0 ? parts.join(" ") : "0 sec";
}

export function formatConfiguration(config?: Video["configuration"]): string {
  if (!config) return "—";
  const parts: string[] = [];
  if (config.videoQuality) {
    parts.push(`Quality: ${config.videoQuality}`);
  }
  if (config.maxResolution) {
    parts.push(`Res: ${config.maxResolution}`);
  }
  if (config.thumbnailImage) {
    parts.push(`Thumb: ${config.thumbnailImage}`);
  }
  if (config.previewImages) {
    parts.push("Previews");
  }
  return parts.length > 0 ? parts.join(", ") : "—";
}

export function getVideoStatusVariant(
  status: Video["status"]
): "default" | "secondary" | "destructive" | "outline" {
  const statusUpper = status.toUpperCase();
  switch (statusUpper) {
    case "PROCESSED":
      return "default";
    case "PROCESSING":
    case "UPLOADING":
      return "secondary";
    case "FAILED":
      return "destructive";
    default:
      return "outline";
  }
}

