"use client";

import { ContentProvider, ImageViewer } from "@/components/content-player";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ImageViewerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apiKey: string;
  projectName: string;
  imagePath: string;
}

export function ImageViewerDialog({
  open,
  onOpenChange,
  apiKey,
  imagePath,
  projectName,
}: ImageViewerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-[900px] h-[90vh] overflow-y-auto">
        <DialogHeader className="h-fit">
          <DialogTitle>Image Viewer</DialogTitle>
          <DialogDescription>View processed image content.</DialogDescription>
        </DialogHeader>
        <div className="relative p-2 rounded-md border border-input bg-muted/50 flex items-center justify-center min-h-[calc(90vh-150px)] w-full">
          <ContentProvider apiKey={apiKey} projectName={projectName}>
            <ImageViewer imagePath={imagePath} />
          </ContentProvider>
        </div> 
      </DialogContent>
    </Dialog>
  );
}
