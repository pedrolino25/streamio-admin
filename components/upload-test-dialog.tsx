"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { ErrorMessage } from "@/components/ui/error-message";
import { SuccessMessage } from "@/components/ui/success-message";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Upload } from "lucide-react";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { uploadTestSchema, UploadTestFormValues } from "@/lib/schemas/upload-schemas";
import { uploadToS3 } from "streamio-lib";

export function UploadTestDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [s3Key, setS3Key] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<UploadTestFormValues>({
    resolver: zodResolver(uploadTestSchema),
    defaultValues: {
      apiKey: "",
      path: "",
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
      const result = await uploadToS3({
        file: values.file,
        path: values.path?.trim() || "",
        config: {
          region: process.env.NEXT_PUBLIC_AWS_REGION!,
          accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID!,
          secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY!,
          apiKey: values.apiKey.trim(),
          lambda: process.env.NEXT_PUBLIC_UPLOAD_LAMBDA_FUNCTION_NAME!,
        },
        onProgress: (progress: number) => {
          setUploadProgress(progress);
        },
      });

      if (result.success) {
        setSuccess(true);
        setS3Key(result.s3Key || "");
        setUploadProgress(100);
      } else {
        setError(result.error || "Upload failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setUploadProgress(0);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      form.reset();
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
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="mr-2 h-4 w-4" />
          Upload Test
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Test</DialogTitle>
          <DialogDescription>
            Test file upload by providing an API key and selecting a file. The
            file will be uploaded to S3 using a presigned URL.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <div className="grid gap-4 py-4">
              <FormField
                control={form.control}
                name="apiKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>API Key</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your API key"
                        {...field}
                        disabled={loading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                      Optional path prefix for the file in S3. Include trailing slash if
                      needed.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="file"
                render={({ field: { value, onChange, ...field } }) => (
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
                        {...field}
                        ref={(e) => {
                          field.ref(e);
                          if (fileInputRef.current !== e) {
                            (fileInputRef as React.MutableRefObject<HTMLInputElement | null>).current = e;
                          }
                        }}
                      />
                    </FormControl>
                    {selectedFile && (
                      <FormDescription>
                        Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
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
