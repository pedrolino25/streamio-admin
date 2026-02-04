import { useGetContentQuery } from "@/lib/store/api";
import { extractErrorMessage } from "@/lib/utils/error-extractor";
import { skipToken } from "@reduxjs/toolkit/query";

export function useContent(projectName: string, apiKey: string) {
  const {
    data: content = [],
    isLoading: loading,
    error,
    refetch,
  } = useGetContentQuery(
    apiKey && projectName?.trim()
      ? { projectName, apiKey }
      : skipToken
  );

  return {
    content,
    loading,
    error: extractErrorMessage(error),
    refetch: async () => {
      await refetch();
    },
  };
}
