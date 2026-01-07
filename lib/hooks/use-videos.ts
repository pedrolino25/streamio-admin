import { useGetVideosQuery } from "@/lib/store/api";
import { extractErrorMessage } from "@/lib/utils/error-extractor";
import { skipToken } from "@reduxjs/toolkit/query";

export function useVideos(projectName: string, apiKey: string) {
  const {
    data: videos = [],
    isLoading: loading,
    error,
    refetch,
  } = useGetVideosQuery(
    apiKey && projectName?.trim()
      ? { projectName, apiKey }
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
