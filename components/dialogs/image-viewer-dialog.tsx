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
      <DialogContent className="max-w-[95vw] sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Image Viewer</DialogTitle>
          <DialogDescription>View processed image content.</DialogDescription>
        </DialogHeader>
        <ContentProvider apiKey={apiKey} projectName={projectName}>
          <ImageViewer imagePath={imagePath} />
        </ContentProvider>
      </DialogContent>
    </Dialog>
  );
}
