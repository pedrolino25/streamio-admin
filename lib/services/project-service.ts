import {
  ApplicationError,
  ErrorCode,
  normalizeError,
} from "@/lib/types/errors";
import { apiClient } from "./api-client";

export interface Project {
  project_id: string;
  project_name?: string;
  webhook_url?: string;
  created_at?: string;
}

export interface CreateProjectRequest {
  project_name: string;
  webhook_url: string;
}

export interface CreateProjectResponse {
  project_id: string;
  project_name: string;
  webhook_url: string;
}

export class ProjectService {
  async getAllProjects(idToken: string): Promise<Project[]> {
    try {
      return await apiClient.get<Project[]>("/api/projects", idToken);
    } catch (error) {
      const normalizedError = normalizeError(error);

      if (normalizedError.code === ErrorCode.UNAUTHORIZED) {
        throw new ApplicationError(
          ErrorCode.UNAUTHORIZED,
          "Your session has expired. Please sign in again.",
          { details: normalizedError.details }
        );
      }

      if (normalizedError.code === ErrorCode.NETWORK_ERROR) {
        throw new ApplicationError(
          ErrorCode.NETWORK_ERROR,
          "Unable to connect to the server. Please check your internet connection.",
          { details: normalizedError.details }
        );
      }

      throw new ApplicationError(
        ErrorCode.OPERATION_FAILED,
        "Failed to fetch projects. Please try again later.",
        { details: normalizedError.message, originalError: error }
      );
    }
  }

  async createProject(
    idToken: string,
    data: CreateProjectRequest
  ): Promise<CreateProjectResponse> {
    try {
      if (!data.project_name?.trim()) {
        throw new ApplicationError(
          ErrorCode.VALIDATION_ERROR,
          "Project name is required"
        );
      }

      if (!data.webhook_url?.trim()) {
        throw new ApplicationError(
          ErrorCode.VALIDATION_ERROR,
          "Webhook URL is required"
        );
      }

      return await apiClient.post<CreateProjectResponse>(
        "/api/projects",
        idToken,
        data
      );
    } catch (error) {
      const normalizedError = normalizeError(error);

      if (normalizedError.code === ErrorCode.CONFLICT) {
        throw new ApplicationError(
          ErrorCode.PROJECT_EXISTS,
          "A project with this name already exists",
          { details: normalizedError.details }
        );
      }

      if (normalizedError.code === ErrorCode.VALIDATION_ERROR) {
        throw normalizedError;
      }

      if (normalizedError.code === ErrorCode.UNAUTHORIZED) {
        throw new ApplicationError(
          ErrorCode.UNAUTHORIZED,
          "Your session has expired. Please sign in again.",
          { details: normalizedError.details }
        );
      }

      throw new ApplicationError(
        ErrorCode.OPERATION_FAILED,
        "Failed to create project. Please try again.",
        { details: normalizedError.message, originalError: error }
      );
    }
  }

  async deleteProject(idToken: string, projectId: string): Promise<void> {
    try {
      if (!projectId?.trim()) {
        throw new ApplicationError(
          ErrorCode.VALIDATION_ERROR,
          "Project ID is required"
        );
      }

      await apiClient.delete(`/api/projects/${projectId}`, idToken);
    } catch (error) {
      const normalizedError = normalizeError(error);

      if (normalizedError.code === ErrorCode.NOT_FOUND) {
        throw new ApplicationError(
          ErrorCode.PROJECT_NOT_FOUND,
          "Project not found. It may have already been deleted.",
          { details: normalizedError.details }
        );
      }

      if (normalizedError.code === ErrorCode.UNAUTHORIZED) {
        throw new ApplicationError(
          ErrorCode.UNAUTHORIZED,
          "Your session has expired. Please sign in again.",
          { details: normalizedError.details }
        );
      }

      throw new ApplicationError(
        ErrorCode.OPERATION_FAILED,
        "Failed to delete project. Please try again.",
        { details: normalizedError.message, originalError: error }
      );
    }
  }

  async projectNameExists(
    idToken: string,
    projectName: string
  ): Promise<boolean> {
    try {
      const projects = await this.getAllProjects(idToken);
      return projects.some(
        (p) => p.project_name?.toLowerCase() === projectName.toLowerCase()
      );
    } catch {
      return false;
    }
  }
}

export const projectService = new ProjectService();
