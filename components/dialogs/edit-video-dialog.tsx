"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ErrorMessage } from "@/components/ui/error-message";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useToast } from "@/components/ui/toast-container";
import { useUpdateVideoMutation } from "@/lib/store/api";
import { transformRtkQueryError } from "@/lib/utils/error-extractor";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

const editVideoSchema = z.object({
  videoTitle: z
    .string()
    .max(100, "Video title must be 100 characters or less")
    .optional()
    .or(z.literal("")),
});

type EditVideoFormValues = z.infer<typeof editVideoSchema>;

interface EditVideoDialogProps {
  videoId: string;
  currentTitle?: string;
  apiKey: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditVideoDialog({
  videoId,
  currentTitle,
  apiKey,
  open,
  onOpenChange,
  onSuccess,
}: EditVideoDialogProps) {
  const [updateVideo, { isLoading: updating, error: updateError }] =
    useUpdateVideoMutation();
  const { success, error: showErrorToast } = useToast();

  const form = useForm<EditVideoFormValues>({
    resolver: zodResolver(editVideoSchema),
    defaultValues: {
      videoTitle: currentTitle || "",
    },
  });

  const handleSubmit = async (values: EditVideoFormValues) => {
    try {
      await updateVideo({
        videoId,
        videoTitle: values.videoTitle?.trim() || "",
        apiKey,
      }).unwrap();
      success("Video title updated successfully");
      onSuccess();
      handleOpenChange(false);
    } catch (err) {
      const transformedError = transformRtkQueryError(err);
      showErrorToast(
        transformedError.message || "Failed to update video title"
      );
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
    if (!newOpen) {
      form.reset({ videoTitle: currentTitle || "" });
    } else {
      form.reset({ videoTitle: currentTitle || "" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Video Title</DialogTitle>
          <DialogDescription>
            Update the title for this video. Leave empty to remove the title.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <div className="grid gap-4 py-4">
              <FormField
                control={form.control}
                name="videoTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Video Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter video title"
                        maxLength={100}
                        {...field}
                        disabled={updating}
                      />
                    </FormControl>
                    <FormDescription>
                      Optional title for the video (max 100 characters)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {updateError && (
                <ErrorMessage
                  message={
                    "data" in updateError &&
                    typeof updateError.data === "object" &&
                    updateError.data &&
                    "message" in updateError.data
                      ? String(updateError.data.message)
                      : "Failed to update video title"
                  }
                />
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={updating}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updating}>
                {updating ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Pencil className="mr-2 h-4 w-4" />
                    Update
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

