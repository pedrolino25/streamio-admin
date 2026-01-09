"use client";

import { logger } from "@/lib/services/logger";
import Hls from "hls.js";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export interface VideoPlayerProviderResponse {
  baseUrl: string;
  queryParams: string;
  expiresAt?: number;
}

export interface VideoPlayerProviderContextType {
  baseUrl: string | null;
  queryParams: string | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const VideoPlayerProviderContext = createContext<
  VideoPlayerProviderContextType | undefined
>(undefined);

const SIGNED_URL_ENDPOINT = "https://api.stream-io.cloud/presigned-play-url";
const REFRESH_BUFFER = 1 * 60 * 1000;
const DEFAULT_EXPIRATION = 10 * 60 * 1000;

function VideoPlayerProvider({
  children,
  apiKey,
  projectName,
}: {
  children: ReactNode;
  apiKey: string;
  projectName?: string;
}) {
  const [baseUrl, setBaseUrl] = useState<string | null>(null);
  const [queryParams, setQueryParams] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const loadingRef = useRef(false);

  const fetchSignedUrl = useCallback(async () => {
    if (!apiKey || !projectName || loadingRef.current) return;

    try {
      loadingRef.current = true;
      setLoading(true);
      setError(null);

      const response = await fetch(SIGNED_URL_ENDPOINT, {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectName,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch signed URL`);
      }

      const result: VideoPlayerProviderResponse = await response.json();
      setBaseUrl(result.baseUrl);
      setQueryParams(result.queryParams);
      setExpiresAt(result.expiresAt || Date.now() + DEFAULT_EXPIRATION);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch signed URL";
      setError(message);
      logger.error("Error fetching signed URL", err);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [apiKey, projectName]);

  useEffect(() => {
    if (apiKey && projectName) {
      fetchSignedUrl();
    }
  }, [apiKey, projectName, fetchSignedUrl]);

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (!expiresAt || !apiKey) return;

    const refreshTime = Math.max(expiresAt - Date.now() - REFRESH_BUFFER, 0);
    if (refreshTime > 0) {
      timeoutRef.current = setTimeout(fetchSignedUrl, refreshTime);
    } else {
      fetchSignedUrl();
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [expiresAt, apiKey, fetchSignedUrl]);

  const value = useMemo(
    () => ({
      baseUrl,
      queryParams,
      loading,
      error,
      refresh: () => fetchSignedUrl(),
    }),
    [baseUrl, queryParams, loading, error, fetchSignedUrl]
  );

  return (
    <VideoPlayerProviderContext.Provider value={value}>
      {baseUrl && queryParams && children}
    </VideoPlayerProviderContext.Provider>
  );
}

function useVideoPlayerProvider() {
  const context = useContext(VideoPlayerProviderContext);
  if (context === undefined) {
    throw new Error(
      "useVideoPlayerProvider must be used within a VideoPlayerProvider"
    );
  }
  return context;
}

interface VideoPlayerProps {
  videoPath: string;
}

function VideoPlayer({ videoPath }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const { baseUrl, queryParams } = useVideoPlayerProvider();

  const buildUrl = (filename: string): string | null => {
    if (!videoPath || !baseUrl || !queryParams) return null;
    const cleanPath = videoPath
      .trim()
      .replace(/\/master\.m3u8$/, "")
      .replace(/^\/+|\/+$/g, "");
    const cleanBaseUrl = baseUrl.replace(/\/+$/, "");
    return `${cleanBaseUrl}/${cleanPath}/${filename}?${queryParams}`;
  };

  const videoUrl = buildUrl("master.m3u8");
  const thumbnailUrl = buildUrl("thumbnail.jpg");

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoUrl) return;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (Hls.isSupported()) {
      const urlObj = new URL(videoUrl);
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

      hls.attachMedia(video);
      hls.loadSource(videoUrl);

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              hls.destroy();
              break;
          }
        }
      });

      hlsRef.current = hls;
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = videoUrl;
      video.load();
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [videoUrl]);

  if (!videoPath || !baseUrl || !queryParams || !videoUrl) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="rounded-md border border-input">
        <video
          ref={videoRef}
          src={videoUrl}
          controls
          controlsList="nodownload"
          playsInline
          className="w-full rounded-md"
          style={{ maxHeight: "500px" }}
          poster={thumbnailUrl || undefined}
        />
      </div>
    </div>
  );
}

export { VideoPlayer, VideoPlayerProvider };
