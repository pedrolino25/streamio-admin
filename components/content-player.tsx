"use client";

import { logger } from "@/lib/services/logger";
import Hls from "hls.js";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export interface ContentProviderResponse {
  baseUrl: string;
  queryParams: string;
  expiresAt?: number;
}

export interface ContentProviderContextType {
  baseUrl: string | null;
  queryParams: string | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const ContentProviderContext = createContext<
  ContentProviderContextType | undefined
>(undefined);

const SIGNED_URL_ENDPOINT = "https://api.stream-io.cloud/presigned-play-url";
const REFRESH_BUFFER = 1 * 60 * 1000;
const DEFAULT_EXPIRATION = 10 * 60 * 1000;

function ContentProvider({
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

      const result: ContentProviderResponse = await response.json();
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
    <ContentProviderContext.Provider value={value}>
      {baseUrl && queryParams && children}
    </ContentProviderContext.Provider>
  );
}

function useContentProvider() {
  const context = useContext(ContentProviderContext);
  if (context === undefined) {
    throw new Error(
      "useContentProvider must be used within a ContentProvider"
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
  const thumbnailPreviewRef = useRef<HTMLDivElement>(null);
  const [spriteImageUrl, setSpriteImageUrl] = useState<string | null>(null);
  const [spriteDimensions, setSpriteDimensions] = useState<{
    width: number;
    height: number;
    thumbWidth: number;
    thumbHeight: number;
    cols: number;
    rows: number;
  } | null>(null);
  const { baseUrl, queryParams } = useContentProvider();

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
  const previewSpriteUrl = buildUrl("preview_sprite.jpg");

  useEffect(() => {
    if (!previewSpriteUrl) return;

    setSpriteImageUrl(previewSpriteUrl);

    const img = document.createElement("img");
    img.onload = () => {
      const commonThumbWidths = [160, 320, 240, 200, 120];
      const spriteWidth = img.width;
      const spriteHeight = img.height;

      let thumbWidth = 160;
      let thumbHeight = 90;
      let cols = Math.floor(spriteWidth / thumbWidth);
      let rows = Math.floor(spriteHeight / thumbHeight);

      for (const width of commonThumbWidths) {
        const height = Math.round(width * (9 / 16));
        const testCols = Math.floor(spriteWidth / width);
        const testRows = Math.floor(spriteHeight / height);
        const widthRemainder = spriteWidth % width;
        const heightRemainder = spriteHeight % height;

        if (widthRemainder < width * 0.1 && heightRemainder < height * 0.1) {
          thumbWidth = width;
          thumbHeight = height;
          cols = testCols;
          rows = testRows;
          break;
        }
      }

      if (cols === 0) {
        cols = 10;
        thumbWidth = Math.floor(spriteWidth / cols);
        thumbHeight = Math.round(thumbWidth * (9 / 16));
        rows = Math.floor(spriteHeight / thumbHeight);
      }

      setSpriteDimensions({
        width: spriteWidth,
        height: spriteHeight,
        thumbWidth,
        thumbHeight,
        cols: Math.max(1, cols),
        rows: Math.max(1, rows),
      });
    };
    img.onerror = () => {
      setSpriteImageUrl(null);
      setSpriteDimensions(null);
    };
    img.src = previewSpriteUrl;
  }, [previewSpriteUrl]);

  useEffect(() => {
    const video = videoRef.current;
    const videoContainer = video?.parentElement;
    const thumbnailPreview = thumbnailPreviewRef.current;
    if (
      !video ||
      !videoContainer ||
      !thumbnailPreview ||
      !spriteDimensions ||
      !spriteImageUrl
    ) {
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!video.duration || !video.readyState) return;

      const rect = videoContainer.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const videoHeight = rect.height;
      const isNearBottom = y > videoHeight * 0.85;

      if (!isNearBottom) {
        thumbnailPreview.style.display = "none";
        return;
      }

      const percent = Math.max(0, Math.min(1, x / rect.width));
      const time = percent * video.duration;
      const totalThumbnails = spriteDimensions.cols * spriteDimensions.rows;
      const thumbnailIndex = Math.floor(
        Math.min(time / video.duration, 0.999) * totalThumbnails
      );

      const col = thumbnailIndex % spriteDimensions.cols;
      const row = Math.floor(thumbnailIndex / spriteDimensions.cols);
      const spriteX = col * spriteDimensions.thumbWidth;
      const spriteY = row * spriteDimensions.thumbHeight;
      const previewWidth = spriteDimensions.thumbWidth;
      const previewHeight = spriteDimensions.thumbHeight;
      const previewLeft = Math.max(
        10,
        Math.min(x - previewWidth / 2, rect.width - previewWidth - 10)
      );
      const previewTop = Math.max(10, videoHeight - 60 - previewHeight - 10);

      thumbnailPreview.style.display = "block";
      thumbnailPreview.style.left = `${previewLeft}px`;
      thumbnailPreview.style.top = `${previewTop}px`;
      thumbnailPreview.style.backgroundImage = `url(${spriteImageUrl})`;
      thumbnailPreview.style.backgroundPosition = `-${spriteX}px -${spriteY}px`;
      thumbnailPreview.style.backgroundSize = `${spriteDimensions.width}px ${spriteDimensions.height}px`;
      thumbnailPreview.style.width = `${previewWidth}px`;
      thumbnailPreview.style.height = `${previewHeight}px`;
    };

    const handleMouseLeave = () => {
      thumbnailPreview.style.display = "none";
    };

    videoContainer.addEventListener("mousemove", handleMouseMove);
    videoContainer.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      videoContainer.removeEventListener("mousemove", handleMouseMove);
      videoContainer.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [spriteDimensions, spriteImageUrl]);

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
    <div className="relative max-w-full h-full">
      <video
        ref={videoRef}
        src={videoUrl}
        controls
        controlsList="nodownload"
        playsInline
        className="w-full h-full object-contain"
        poster={thumbnailUrl || undefined}
      />
      {spriteDimensions && spriteImageUrl && (
        <div
          ref={thumbnailPreviewRef}
          className="absolute pointer-events-none z-10 border-2 border-white shadow-lg rounded bg-black"
          style={{
            display: "none",
          }}
        />
      )}
    </div>
  );
}

const IMAGE_VARIANTS = [
  { name: "thumb", width: 150 },
  { name: "small", width: 480 },
  { name: "medium", width: 720 },
  { name: "large", width: 1080 },
  { name: "xlarge", width: 1920 },
] as const;

interface ImageViewerProps {
  imagePath: string;
}

function ImageViewer({ imagePath }: ImageViewerProps) {
  const { baseUrl, queryParams, loading, error } = useContentProvider();

  const containerRef = useRef<HTMLDivElement | null>(null);

  const [selectedVariant, setSelectedVariant] = useState<
    typeof IMAGE_VARIANTS[number]
  >(IMAGE_VARIANTS[0]);

  const [imageError, setImageError] = useState(false);

  useLayoutEffect(() => {
    if (!containerRef.current) return;

    const calculateVariant = (containerWidth: number) => {
      if (containerWidth <= 0) {
        setSelectedVariant(IMAGE_VARIANTS[0]);
        return;
      }

      const dpr = window.devicePixelRatio || 1;
      const targetWidth = containerWidth * dpr;

      const best =
        IMAGE_VARIANTS.find(v => v.width >= targetWidth) ??
        IMAGE_VARIANTS[IMAGE_VARIANTS.length - 1];

      setSelectedVariant(best);
    };

    const initialWidth = containerRef.current.getBoundingClientRect().width;

    calculateVariant(initialWidth);

    const observer = new ResizeObserver(([entry]) => {
      calculateVariant(entry.contentRect.width);
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const urls = useMemo(() => {
    if (!baseUrl || !queryParams || !imagePath || !selectedVariant) return null;

    const cleanPath = imagePath.trim().replace(/^\/+|\/+$/g, "");
    const cleanBaseUrl = baseUrl.replace(/\/+$/, "");
    const base = `${cleanBaseUrl}/${cleanPath}/image_${selectedVariant.name}`;

    return {
      webp: `${base}.webp?${queryParams}`,
      jpg: `${base}.jpg?${queryParams}`,
    };
  }, [baseUrl, queryParams, imagePath, selectedVariant]);


  if (loading || !urls) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || imageError) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        <p>Failed to load image</p>
      </div>
    );
  }

  return (
    <picture ref={containerRef} className="h-full w-full flex items-center justify-center">
      <source srcSet={urls.webp} type="image/webp" />
      <img
        src={urls.jpg}
        alt="Content preview"
        className="max-w-full max-h-full object-contain"
        onError={() => setImageError(true)}
        loading="lazy"
      />
    </picture>
  );
}

export { ContentProvider, ImageViewer, useContentProvider, VideoPlayer };

