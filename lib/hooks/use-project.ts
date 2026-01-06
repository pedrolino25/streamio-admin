import { useAuth } from "@/lib/auth-context";
import { Project, projectService } from "@/lib/services/project-service";
import { useCallback, useEffect, useRef, useState } from "react";

interface UseProjectReturn {
  project: Project | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useProject(projectId: string): UseProjectReturn {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { session } = useAuth();
  const idTokenRef = useRef<string | null>(null);
  const projectIdRef = useRef<string | null>(null);

  const fetchProject = useCallback(async () => {
    const currentToken = session?.idToken;

    if (!currentToken) {
      setLoading(false);
      setProject(null);
      setError(null);
      idTokenRef.current = null;
      return;
    }

    if (!projectId?.trim()) {
      setLoading(false);
      setProject(null);
      setError(null);
      return;
    }

    if (
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

      const data = await projectService.getProjectById(currentToken, projectId);
      setProject(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch project";
      setError(errorMessage);
      setProject(null);
      idTokenRef.current = null;
      projectIdRef.current = null;
    } finally {
      setLoading(false);
    }
  }, [session?.idToken, projectId]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  return {
    project,
    loading,
    error,
    refetch: fetchProject,
  };
}

