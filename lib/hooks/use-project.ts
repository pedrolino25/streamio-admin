import { useAuth } from "@/lib/auth-context";
import { useGetProjectQuery } from "@/lib/store/api";
import { extractErrorMessage } from "@/lib/utils/error-extractor";
import { skipToken } from "@reduxjs/toolkit/query";

export function useProject(projectName: string) {
  const { session } = useAuth();
  const token = session?.idToken || null;

  const {
    data: project = null,
    isLoading: loading,
    error,
    refetch,
  } = useGetProjectQuery(
    token && projectName?.trim() ? { projectName, token } : skipToken
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
