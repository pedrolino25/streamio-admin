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
import { useUpdateContentMutation } from "@/lib/store/api";
import { transformRtkQueryError } from "@/lib/utils/error-extractor";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

const editContentSchema = z.object({
  contentTitle: z
    .string()
    .max(100, "Content title must be 100 characters or less")
    .optional()
    .or(z.literal("")),
});

type EditContentFormValues = z.infer<typeof editContentSchema>;

interface EditContentDialogProps {
  contentId: string;
  contentType: "video" | "image";
  currentTitle?: string;
  apiKey: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditContentDialog({
  contentId,
  contentType,
  currentTitle,
  apiKey,
  open,
  onOpenChange,
  onSuccess,
}: EditContentDialogProps) {
  const [updateContent, { isLoading: updating, error: updateError }] =
    useUpdateContentMutation();
  const { success, error: showErrorToast } = useToast();

  const form = useForm<EditContentFormValues>({
    resolver: zodResolver(editContentSchema),
    defaultValues: {
      contentTitle: currentTitle || "",
    },
  });

  const handleSubmit = async (values: EditContentFormValues) => {
    try {
      await updateContent({
        contentId,
        contentTitle: values.contentTitle?.trim() || "",
        apiKey,
      }).unwrap();
      success(`${contentType === "video" ? "Video" : "Image"} title updated successfully`);
      onSuccess();
      handleOpenChange(false);
    } catch (err) {
      const transformedError = transformRtkQueryError(err);
      showErrorToast(
        transformedError.message || `Failed to update ${contentType} title`
      );
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
    if (!newOpen) {
      form.reset({ contentTitle: currentTitle || "" });
    } else {
      form.reset({ contentTitle: currentTitle || "" });
    }
  };

  const contentTypeLabel = contentType === "video" ? "Video" : "Image";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit {contentTypeLabel} Title</DialogTitle>
          <DialogDescription>
            Update the title for this {contentType}. Leave empty to remove the title.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <div className="grid gap-4 py-4">
              <FormField
                control={form.control}
                name="contentTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{contentTypeLabel} Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={`Enter ${contentType} title`}
                        maxLength={100}
                        {...field}
                        disabled={updating}
                      />
                    </FormControl>
                    <FormDescription>
                      Optional title for the {contentType} (max 100 characters)
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
                      : `Failed to update ${contentType} title`
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
