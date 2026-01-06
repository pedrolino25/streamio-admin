import { useAuth } from "@/lib/auth-context";
import { Video, videoService } from "@/lib/services/video-service";
import { useCallback, useEffect, useRef, useState } from "react";

interface UseVideosReturn {
  videos: Video[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useVideos(projectId: string): UseVideosReturn {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { session } = useAuth();
  const idTokenRef = useRef<string | null>(null);
  const projectIdRef = useRef<string | null>(null);

  const fetchVideos = useCallback(async (force = false) => {
    const currentToken = session?.idToken;

    if (!currentToken) {
      setLoading(false);
      setVideos([]);
      setError(null);
      idTokenRef.current = null;
      return;
    }

    if (!projectId?.trim()) {
      setLoading(false);
      setVideos([]);
      setError(null);
      return;
    }

    if (
      !force &&
      idTokenRef.current === currentToken &&
      projectIdRef.current === projectId
    ) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      idTokenRef.current = currentToken;
      projectIdRef.current = projectId;

      const data = await videoService.getVideosByProjectId(
        currentToken,
        projectId
      );
      setVideos(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch videos";
      setError(errorMessage);
      setVideos([]);
      idTokenRef.current = null;
      projectIdRef.current = null;
    } finally {
      setLoading(false);
    }
  }, [session?.idToken, projectId]);

  const refetch = useCallback(async () => {
    await fetchVideos(true);
  }, [fetchVideos]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  return {
    videos,
    loading,
    error,
    refetch,
  };
}
