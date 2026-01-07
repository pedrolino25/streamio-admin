import { useGetProjectQuery } from "@/lib/store/api";
import { extractErrorMessage } from "@/lib/utils/error-extractor";
import { skipToken } from "@reduxjs/toolkit/query";

export function useProject(projectName: string, apiKey: string) {
  const {
    data: project = null,
    isLoading: loading,
    error,
    refetch,
  } = useGetProjectQuery(
    apiKey && projectName?.trim() ? { projectName, apiKey } : skipToken
  );

  return {
    project,
    loading,
    error: extractErrorMessage(error),
    refetch: async () => {
      await refetch();
    },
  };
}
