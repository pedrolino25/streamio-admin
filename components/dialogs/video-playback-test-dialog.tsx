"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  VideoPlaybackTestFormValues,
  videoPlaybackTestSchema,
} from "@/lib/schemas/video-playback-schemas";
import { SignedUrlProvider, useSignedUrl } from "@/lib/signed-url-context";
import { zodResolver } from "@hookform/resolvers/zod";
import Hls from "hls.js";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";

interface VideoPlaybackTestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apiKey: string;
  projectName: string;
  initialVideoPath?: string;
}

function VideoPlaybackTestDialogContent({
  open,
  onOpenChange,
  initialVideoPath,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialVideoPath?: string;
}) {
  const [error, setError] = useState("");
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const { baseUrl, queryParams, loading, error: contextError } = useSignedUrl();

  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const form = useForm<VideoPlaybackTestFormValues>({
    resolver: zodResolver(videoPlaybackTestSchema),
    defaultValues: {
      videoUrl: initialVideoPath || "",
    },
  });

  // Update form when initialVideoPath changes
  useEffect(() => {
    if (initialVideoPath && open) {
      form.setValue("videoUrl", initialVideoPath);
    }
  }, [initialVideoPath, open, form]);

  // Auto-play video when initialVideoPath is provided and signed URL is ready
  useEffect(() => {
    if (initialVideoPath && open && baseUrl && queryParams) {
      setError("");
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.src = "";
      }

      const trimmedPath = initialVideoPath.trim();
      const pathWithoutLeadingSlash = trimmedPath.startsWith("/")
        ? trimmedPath.slice(1)
        : trimmedPath;
      const baseUrlWithoutTrailingSlash = baseUrl.endsWith("/")
        ? baseUrl.slice(0, -1)
        : baseUrl;
      const url = `${baseUrlWithoutTrailingSlash}/${pathWithoutLeadingSlash}?${queryParams}`;
      setSignedUrl(url);
    }
  }, [initialVideoPath, open, baseUrl, queryParams]);

  useEffect(() => {
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!signedUrl) return;

    const currentSignedUrl = signedUrl;

    const initializeVideoPlayer = () => {
      if (!videoRef.current || !currentSignedUrl) return;

      const video = videoRef.current;

      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }

      if (Hls.isSupported()) {
        const urlObj = new URL(currentSignedUrl);
        const queryString = urlObj.search;

        const CustomLoader = class extends Hls.DefaultConfig.loader {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          load(context: any, config: any, callbacks: any) {
            if (context.url && !context.url.includes("?")) {
              context.url = context.url + queryString;
            }
            return super.load(context, config, callbacks);
          }
        };

        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: false,
          loader: CustomLoader,
        });

        hls.loadSource(currentSignedUrl);
        hls.attachMedia(video);

        hls.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                setError(
                  "Network error occurred. Please check the URL and try again."
                );
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                setError("Media error occurred. Trying to recover...");
                hls.recoverMediaError();
                break;
              default:
                setError(
                  "Fatal error occurred. Please check the URL and try again."
                );
                hls.destroy();
                break;
            }
          }
        });

        hlsRef.current = hls;
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = currentSignedUrl;
      } else {
        setError("HLS playback is not supported in this browser.");
      }
    };

    if (!videoRef.current) {
      const timer = setTimeout(() => {
        initializeVideoPlayer();
      }, 100);
      return () => clearTimeout(timer);
    }

    initializeVideoPlayer();

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [signedUrl]);

  const handleSubmit = async (values: VideoPlaybackTestFormValues) => {
    setError("");
    setSignedUrl(null);

    if (!baseUrl || !queryParams) {
      setError("Signed URL is not available. Please wait for it to load.");
      return;
    }

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const url = `${baseUrl}/${values.videoUrl.trim()}?${queryParams}`;
    setSignedUrl(url);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset();
      setError("");
      setSignedUrl(null);
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.src = "";
      }
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Video Playback</DialogTitle>
          <DialogDescription>
            {initialVideoPath
              ? "Video player for HLS video playback."
              : "Test HLS video playback by providing a video URL. Video will play in an HLS video player."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <div className="grid gap-4 py-4">
              {!initialVideoPath && (
                <FormField
                  control={form.control}
                  name="videoUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Video Path</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="videos/2024/video.m3u8"
                          {...field}
                          disabled={loading}
                        />
                      </FormControl>
                      <FormDescription>
                        Enter the path to your HLS video file (should end with
                        .m3u8)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {(error || contextError) && (
                <ErrorMessage message={error || contextError || ""} />
              )}

              {loading && !signedUrl && initialVideoPath && (
                <div className="flex items-center justify-center py-8">
                  <LoadingSpinner size="lg" />
                </div>
              )}

              {(initialVideoPath || signedUrl) && (
                <div className="space-y-2">
                  <div className="rounded-md border border-input">
                    <video
                      ref={videoRef}
                      controls
                      className="w-full rounded-md"
                      style={{ maxHeight: "500px" }}
                    />
                  </div>
                </div>
              )}
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export function VideoPlaybackTestDialog({
  open,
  onOpenChange,
  apiKey,
  initialVideoPath,
  projectName,
}: VideoPlaybackTestDialogProps) {
  return (
    <SignedUrlProvider apiKey={apiKey} projectName={projectName}>
      <VideoPlaybackTestDialogContent
        open={open}
        onOpenChange={onOpenChange}
        initialVideoPath={initialVideoPath}
      />
    </SignedUrlProvider>
  );
}
