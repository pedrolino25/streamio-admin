import { useAuth } from "@/lib/auth-context";
import {
  CreateProjectRequest,
  useCreateProjectMutation,
  useDeleteProjectMutation,
  useGetProjectsQuery,
} from "@/lib/store/api";
import { ApplicationError, ErrorCode } from "@/lib/types/errors";
import {
  extractErrorMessage,
  transformRtkQueryError,
} from "@/lib/utils/error-extractor";
import { skipToken } from "@reduxjs/toolkit/query";

export function useProjects() {
  const { session } = useAuth();
  const token = session?.idToken || null;

  const {
    data: projects = [],
    isLoading: loading,
    error,
    refetch,
  } = useGetProjectsQuery(token || skipToken);

  return {
    projects,
    loading,
    error: extractErrorMessage(error),
    refetch: async () => {
      await refetch();
    },
  };
}

export function useProjectMutations() {
  const { session } = useAuth();
  const token = session?.idToken || null;

  const [
    createProjectMutation,
    { isLoading: createLoading, error: createError, reset: resetCreate },
  ] = useCreateProjectMutation();
  const [
    deleteProjectMutation,
    { isLoading: deleteLoading, error: deleteError, reset: resetDelete },
  ] = useDeleteProjectMutation();

  const createProject = async (data: CreateProjectRequest) => {
    if (!token) {
      throw new ApplicationError(
        ErrorCode.UNAUTHORIZED,
        "You must be signed in to perform this action",
        { statusCode: 401 }
      );
    }
    try {
      await createProjectMutation({ data, token }).unwrap();
    } catch (err) {
      throw transformRtkQueryError(err);
    }
  };

  const deleteProject = async (projectId: string) => {
    if (!token) {
      throw new ApplicationError(
        ErrorCode.UNAUTHORIZED,
        "You must be signed in to perform this action",
        { statusCode: 401 }
      );
    }
    try {
      await deleteProjectMutation({ projectId, token }).unwrap();
    } catch (err) {
      throw transformRtkQueryError(err);
    }
  };

  const getError = (): ApplicationError | null => {
    const error = createError || deleteError;
    if (!error) return null;
    return transformRtkQueryError(error);
  };

  return {
    createProject,
    deleteProject,
    loading: createLoading || deleteLoading,
    error: getError(),
    clearError: () => {
      resetCreate();
      resetDelete();
    },
  };
}
