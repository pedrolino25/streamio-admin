"use client";

import { ContentProvider, VideoPlayer } from "@/components/content-player";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
    <div className="rounded-md p-2 border border-input min-h-[calc(90vh-150px)] w-full flex items-center justify-center">
      <ContentProvider apiKey={apiKey} projectName={projectName}>
        <VideoPlayer videoPath={videoPath} />
      </ContentProvider>
    </div>
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
      <DialogContent className="max-w-[95vw] sm:max-w-[900px] h-[90vh] overflow-y-auto">
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
