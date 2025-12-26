import { useAuth } from "@/lib/auth-context";
import { Project, projectService } from "@/lib/services/project-service";
import { useCallback, useEffect, useRef, useState } from "react";

interface UseProjectsReturn {
  projects: Project[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useProjects(): UseProjectsReturn {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { session } = useAuth();
  const idTokenRef = useRef<string | null>(null);

  const fetchProjects = useCallback(async () => {
    const currentToken = session?.idToken;

    if (!currentToken) {
      setLoading(false);
      setProjects([]);
      setError(null);
      idTokenRef.current = null;
      return;
    }

    if (idTokenRef.current === currentToken) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      idTokenRef.current = currentToken;

      const data = await projectService.getAllProjects(currentToken);
      setProjects(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch projects";
      setError(errorMessage);
      setProjects([]);
      idTokenRef.current = null;
    } finally {
      setLoading(false);
    }
  }, [session?.idToken]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return {
    projects,
    loading,
    error,
    refetch: fetchProjects,
  };
}
