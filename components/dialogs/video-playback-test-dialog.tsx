"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { VideoPlayer, VideoPlayerProvider } from "@/components/video-player";

interface VideoPlaybackTestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apiKey: string;
  projectName: string;
  videoPath: string;
}

function VideoPlaybackTestDialogContent({
  apiKey,
  projectName,
  videoPath,
}: {
  apiKey: string;
  projectName: string;
  videoPath: string;
}) {
  return (
    <VideoPlayerProvider apiKey={apiKey} projectName={projectName}>
      <VideoPlayer videoPath={videoPath} />
    </VideoPlayerProvider>
  );
}

export function VideoPlaybackTestDialog({
  open,
  onOpenChange,
  apiKey,
  videoPath,
  projectName,
}: VideoPlaybackTestDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Video Playback</DialogTitle>
          <DialogDescription>
            Video player for HLS video playback.
          </DialogDescription>
        </DialogHeader>
        <VideoPlaybackTestDialogContent
          apiKey={apiKey}
          projectName={projectName}
          videoPath={videoPath}
        />
      </DialogContent>
    </Dialog>
  );
}
