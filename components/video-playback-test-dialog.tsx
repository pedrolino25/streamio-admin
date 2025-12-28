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
import {
  VideoPlaybackTestFormValues,
  videoPlaybackTestSchema,
} from "@/lib/schemas/video-playback-schemas";
import { SignedUrlProvider, useSignedUrl } from "@/lib/signed-url-context";
import { zodResolver } from "@hookform/resolvers/zod";
import Hls from "hls.js";
import { Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";

interface VideoPlaybackTestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apiKey: string;
}

function VideoPlaybackTestDialogContent({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [error, setError] = useState("");
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const { baseUrl, queryParams, loading, error: contextError } = useSignedUrl();

  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const form = useForm<VideoPlaybackTestFormValues>({
    resolver: zodResolver(videoPlaybackTestSchema),
    defaultValues: {
      videoUrl: "",
    },
  });

  // Cleanup HLS instance when component unmounts or URL changes
  useEffect(() => {
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, []);

  // Initialize HLS player when signed URL is available
  useEffect(() => {
    if (!signedUrl || !videoRef.current) return;

    const video = videoRef.current;

    // Clean up previous HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (Hls.isSupported()) {
      // Extract query parameters from the signed URL to append to segment requests
      const urlObj = new URL(signedUrl);
      const queryString = urlObj.search;

      // Use hls.js for browsers that don't natively support HLS
      // Custom loader to append query parameters to all segment requests
      const CustomLoader = class extends Hls.DefaultConfig.loader {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        load(context: any, config: any, callbacks: any) {
          // Append query parameters to requests that don't already have them
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

      hls.loadSource(signedUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch((err) => {
          console.error("Error playing video:", err);
          setError("Failed to play video. Please check the URL and try again.");
        });
      });

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
      // Native HLS support (Safari)
      video.src = signedUrl;
      video.play().catch((err) => {
        console.error("Error playing video:", err);
        setError("Failed to play video. Please check the URL and try again.");
      });
    } else {
      setError("HLS playback is not supported in this browser.");
    }

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

    // Clean up previous HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    // Use the video URL directly
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
          <DialogTitle>Video Playback Test</DialogTitle>
          <DialogDescription>
            Test HLS video playback by providing a video URL. Video will play in
            an HLS video player.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <div className="grid gap-4 py-4">
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

              {(error || contextError) && (
                <ErrorMessage message={error || contextError || ""} />
              )}

              {signedUrl && (
                <div className="space-y-2">
                  <FormLabel>Video Player</FormLabel>
                  <div className="rounded-md border border-input bg-muted p-4">
                    <video
                      ref={videoRef}
                      controls
                      className="w-full rounded-md"
                      style={{ maxHeight: "500px" }}
                    />
                  </div>
                  <FormDescription>
                    Video URL:{" "}
                    <span className="font-mono text-xs break-all">
                      {signedUrl}
                    </span>
                  </FormDescription>
                </div>
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
              <Button
                type="submit"
                disabled={loading || !baseUrl || !queryParams}
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Play Video
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

export function VideoPlaybackTestDialog({
  open,
  onOpenChange,
  apiKey,
}: VideoPlaybackTestDialogProps) {
  return (
    <SignedUrlProvider apiKey={apiKey}>
      <VideoPlaybackTestDialogContent open={open} onOpenChange={onOpenChange} />
    </SignedUrlProvider>
  );
}
