"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Select } from "@/components/ui/select";
import { SuccessMessage } from "@/components/ui/success-message";
import {
  UploadTestFormValues,
  uploadTestSchema,
} from "@/lib/schemas/upload-schemas";
import { SignedUrlProvider } from "@/lib/signed-url-context";
import { zodResolver } from "@hookform/resolvers/zod";
import { Upload } from "lucide-react";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";

interface UploadTestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apiKey: string;
  projectName: string;
}

function UploadTestDialogContent({
  open,
  onOpenChange,
  apiKey,
  projectName,
}: UploadTestDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [s3Key, setS3Key] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<UploadTestFormValues>({
    resolver: zodResolver(uploadTestSchema),
    defaultValues: {
      path: "",
      configuration: {
        videoQuality: "high",
        maxResolution: "source",
        thumbnailImage: "",
        previewImages: false,
      },
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      form.setValue("file", selectedFile);
      setError("");
      setSuccess(false);
    }
  };

  async function uploadFile(
    file: File,
    apiKey: string,
    path?: string,
    configuration?: {
      videoQuality: "low" | "medium" | "high";
      maxResolution: "720p" | "1080p" | "source";
      thumbnailImage?: string;
      previewImages?: boolean;
    }
  ): Promise<{ uploadUrl: string; s3Key: string; expiresIn: number }> {
    const requestBody: {
      filename: string;
      path: string;
      contentType: string;
      projectName: string;
      configuration?: {
        videoQuality: "low" | "medium" | "high";
        maxResolution: "720p" | "1080p" | "source";
        thumbnailImage?: string;
        previewImages?: boolean;
      };
    } = {
      filename: file.name,
      path: path?.trim() || "",
      contentType: file.type,
      projectName: projectName,
    };

    if (configuration) {
      const config: {
        videoQuality: "low" | "medium" | "high";
        maxResolution: "720p" | "1080p" | "source";
        thumbnailImage?: string;
        previewImages?: boolean;
      } = {
        videoQuality: configuration.videoQuality,
        maxResolution: configuration.maxResolution,
      };

      if (configuration.thumbnailImage?.trim()) {
        config.thumbnailImage = configuration.thumbnailImage.trim();
      }

      if (configuration.previewImages !== undefined) {
        config.previewImages = configuration.previewImages;
      }

      requestBody.configuration = config;
    }

    // All requests to api.stream-io.cloud require the API key in the x-api-key header
    const response = await fetch(
      "https://api.stream-io.cloud/presigned-upload-url",
      {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to get upload URL");
    }

    const { uploadUrl, s3Key, expiresIn } = await response.json();

    setUploadProgress(30);
    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": file.type,
      },
      body: file,
    });

    if (!uploadResponse.ok) {
      throw new Error(`Upload failed: ${uploadResponse.statusText}`);
    }

    return { uploadUrl, s3Key, expiresIn };
  }

  const handleSubmit = async (values: UploadTestFormValues) => {
    if (!values.file) {
      setError("Please select a file");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess(false);
    setUploadProgress(0);
    try {
      const { s3Key } = await uploadFile(
        values.file,
        apiKey,
        values.path?.trim() || "",
        values.configuration
      );
      setSuccess(true);
      setS3Key(s3Key || "");
      setUploadProgress(100);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setUploadProgress(0);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
    if (!newOpen) {
      form.reset();
      form.reset({
        path: "",
        configuration: {
          videoQuality: "high",
          maxResolution: "source",
          thumbnailImage: "",
          previewImages: false,
        },
      });
      setError("");
      setSuccess(false);
      setUploadProgress(0);
      setS3Key("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const selectedFile = form.watch("file");

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Test</DialogTitle>
          <DialogDescription>
            Test file upload by selecting a file. The file will be uploaded to
            S3 using a presigned URL.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <div className="grid gap-4 py-4">
              <FormField
                control={form.control}
                name="path"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Path (optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., videos/2024/"
                        {...field}
                        disabled={loading}
                      />
                    </FormControl>
                    <FormDescription>
                      Optional path prefix for the file in S3. Include trailing
                      slash if needed.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="file"
                render={({ field: { onChange, ...field } }) => (
                  <FormItem>
                    <FormLabel>File</FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            onChange(file);
                            handleFileChange(e);
                          }
                        }}
                        disabled={loading}
                        ref={(e) => {
                          field.ref(e);
                          if (fileInputRef.current !== e) {
                            (
                              fileInputRef as React.MutableRefObject<HTMLInputElement | null>
                            ).current = e;
                          }
                        }}
                      />
                    </FormControl>
                    {selectedFile && (
                      <FormDescription>
                        Selected: {selectedFile.name} (
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="space-y-4 border-t pt-4">
                <h3 className="text-sm font-medium">
                  Processing Configuration
                </h3>
                <FormField
                  control={form.control}
                  name="configuration.videoQuality"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Video Quality</FormLabel>
                      <FormControl>
                        <Select {...field} disabled={loading}>
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </Select>
                      </FormControl>
                      <FormDescription>
                        Quality setting for video processing
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="configuration.maxResolution"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Resolution</FormLabel>
                      <FormControl>
                        <Select {...field} disabled={loading}>
                          <option value="720p">720p</option>
                          <option value="1080p">1080p</option>
                          <option value="source">Source</option>
                        </Select>
                      </FormControl>
                      <FormDescription>
                        Maximum resolution for video processing
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="configuration.thumbnailImage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Thumbnail Image (optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., 10s"
                          {...field}
                          disabled={loading}
                        />
                      </FormControl>
                      <FormDescription>
                        Time position for thumbnail extraction (e.g.,
                        &quot;10s&quot;, &quot;00:00:10&quot;)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="configuration.previewImages"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value || false}
                          onChange={(e) => field.onChange(e.target.checked)}
                          disabled={loading}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Preview Images</FormLabel>
                        <FormDescription>
                          Generate preview images for the video
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
              {error && <ErrorMessage message={error} />}
              {success && (
                <SuccessMessage
                  message="Upload successful!"
                  details={s3Key ? `S3 Key: ${s3Key}` : undefined}
                />
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={loading}
              >
                Close
              </Button>
              <Button type="submit" disabled={loading || !selectedFile}>
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload
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

export function UploadTestDialog({
  open,
  onOpenChange,
  apiKey,
  projectName,
}: UploadTestDialogProps) {
  return (
    <SignedUrlProvider apiKey={apiKey}>
      <UploadTestDialogContent
        open={open}
        onOpenChange={onOpenChange}
        apiKey={apiKey}
        projectName={projectName}
      />
    </SignedUrlProvider>
  );
}
