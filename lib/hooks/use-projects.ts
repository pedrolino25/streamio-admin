import {
  CreateProjectRequest,
  useCreateProjectMutation,
  useDeleteProjectMutation,
  useGetProjectsQuery,
  useUpdateProjectMutation,
} from "@/lib/store/api";
import { ApplicationError, ErrorCode } from "@/lib/types/errors";
import {
  extractErrorMessage,
  transformRtkQueryError,
} from "@/lib/utils/error-extractor";
import { skipToken } from "@reduxjs/toolkit/query";

export function useProjects(apiKey: string) {
  const {
    data: projects = [],
    isLoading: loading,
    error,
    refetch,
  } = useGetProjectsQuery(apiKey && apiKey.trim() ? apiKey : skipToken);

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
  const [
    createProjectMutation,
    { isLoading: createLoading, error: createError, reset: resetCreate },
  ] = useCreateProjectMutation();
  const [
    updateProjectMutation,
    { isLoading: updateLoading, error: updateError, reset: resetUpdate },
  ] = useUpdateProjectMutation();
  const [
    deleteProjectMutation,
    { isLoading: deleteLoading, error: deleteError, reset: resetDelete },
  ] = useDeleteProjectMutation();

  const createProject = async (data: CreateProjectRequest, apiKey: string) => {
    if (!apiKey) {
      throw new ApplicationError(
        ErrorCode.UNAUTHORIZED,
        "API key is required",
        { statusCode: 401 }
      );
    }
    try {
      await createProjectMutation({ data, apiKey }).unwrap();
    } catch (err) {
      throw transformRtkQueryError(err);
    }
  };

  const updateProject = async (data: CreateProjectRequest, apiKey: string) => {
    if (!apiKey) {
      throw new ApplicationError(
        ErrorCode.UNAUTHORIZED,
        "API key is required",
        { statusCode: 401 }
      );
    }
    try {
      await updateProjectMutation({ data, apiKey }).unwrap();
    } catch (err) {
      throw transformRtkQueryError(err);
    }
  };

  const deleteProject = async (projectName: string, apiKey: string) => {
    if (!apiKey) {
      throw new ApplicationError(
        ErrorCode.UNAUTHORIZED,
        "API key is required",
        { statusCode: 401 }
      );
    }
    try {
      await deleteProjectMutation({ projectName, apiKey }).unwrap();
    } catch (err) {
      throw transformRtkQueryError(err);
    }
  };

  const getError = (): ApplicationError | null => {
    const error = createError || updateError || deleteError;
    if (!error) return null;
    return transformRtkQueryError(error);
  };

  return {
    createProject,
    updateProject,
    deleteProject,
    loading: createLoading || updateLoading || deleteLoading,
    error: getError(),
    clearError: () => {
      resetCreate();
      resetUpdate();
      resetDelete();
    },
  };
}
