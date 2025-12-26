import { useAuth } from "@/lib/auth-context";
import {
  CreateProjectRequest,
  projectService,
} from "@/lib/services/project-service";
import { ApplicationError, ErrorCode } from "@/lib/types/errors";
import { useCallback, useState } from "react";

interface UseProjectMutationsReturn {
  createProject: (data: CreateProjectRequest) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  loading: boolean;
  error: ApplicationError | null;
  clearError: () => void;
}

export function useProjectMutations(): UseProjectMutationsReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApplicationError | null>(null);
  const { session } = useAuth();

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const handleMutationError = useCallback(
    (err: unknown, defaultMessage: string): ApplicationError => {
      const appError =
        err instanceof ApplicationError
          ? err
          : new ApplicationError(
              ErrorCode.OPERATION_FAILED,
              err instanceof Error ? err.message : defaultMessage,
              { originalError: err }
            );
      setError(appError);
      return appError;
    },
    []
  );

  const requireAuth = useCallback((): string => {
    if (!session?.idToken) {
      const authError = new ApplicationError(
        ErrorCode.UNAUTHORIZED,
        "You must be signed in to perform this action",
        { statusCode: 401 }
      );
      setError(authError);
      throw authError;
    }
    return session.idToken;
  }, [session?.idToken]);

  const createProject = useCallback(
    async (data: CreateProjectRequest) => {
      const idToken = requireAuth();
      setLoading(true);
      setError(null);

      try {
        await projectService.createProject(idToken, data);
      } catch (err) {
        throw handleMutationError(err, "Failed to create project");
      } finally {
        setLoading(false);
      }
    },
    [requireAuth, handleMutationError]
  );

  const deleteProject = useCallback(
    async (projectId: string) => {
      const idToken = requireAuth();
      setLoading(true);
      setError(null);

      try {
        await projectService.deleteProject(idToken, projectId);
      } catch (err) {
        throw handleMutationError(err, "Failed to delete project");
      } finally {
        setLoading(false);
      }
    },
    [requireAuth, handleMutationError]
  );

  return {
    createProject,
    deleteProject,
    loading,
    error,
    clearError,
  };
}
