import { useAuth } from "@/lib/auth-context";
import { useGetVideosQuery } from "@/lib/store/api";
import { extractErrorMessage } from "@/lib/utils/error-extractor";
import { skipToken } from "@reduxjs/toolkit/query";

export function useVideos(projectName: string) {
  const { session } = useAuth();
  const token = session?.idToken || null;

  const {
    data: videos = [],
    isLoading: loading,
    error,
    refetch,
  } = useGetVideosQuery(
    token && projectName?.trim()
      ? { projectName, token }
      : skipToken
  );

  return {
    videos,
    loading,
    error: extractErrorMessage(error),
    refetch: async () => {
      await refetch();
    },
  };
}

