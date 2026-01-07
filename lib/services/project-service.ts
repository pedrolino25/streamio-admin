import {
  ApplicationError,
  ErrorCode,
  normalizeError,
} from "@/lib/types/errors";
import { externalApiClient } from "./external-api-client";

export interface Project {
  id: string;
  tenantId: string;
  projectName: string;
  webhookUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProjectsResponse {
  data: Project[];
  count: number;
}

export interface CreateProjectRequest {
  projectName: string;
  webhookUrl?: string;
}

export interface CreateProjectResponse {
  id: string;
  tenantId: string;
  projectName: string;
  webhookUrl?: string;
  message: string;
}

export interface UpdateProjectRequest {
  projectName: string;
  webhookUrl?: string;
}

export interface UpdateProjectResponse {
  id: string;
  tenantId: string;
  projectName: string;
  webhookUrl?: string;
  message: string;
}

export async function getAllProjects(apiKey: string): Promise<Project[]> {
  try {
    console.log("getAllProjects", apiKey);
    const response = await externalApiClient.get<ProjectsResponse>(
      "/projects",
      apiKey
    );
    return response.data || [];
  } catch (error) {
    const normalizedError = normalizeError(error);

    if (normalizedError.code === ErrorCode.UNAUTHORIZED) {
      throw new ApplicationError(
        ErrorCode.UNAUTHORIZED,
        "Invalid API key. Please check your tenant API key.",
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
      { details: normalizedError.message, originalError: normalizedError }
    );
  }
}

export async function getProject(
  apiKey: string,
  projectName: string
): Promise<Project> {
  try {
    return await externalApiClient.get<Project>(
      `/project?projectName=${encodeURIComponent(projectName)}`,
      apiKey
    );
  } catch (error) {
    const normalizedError = normalizeError(error);

    if (normalizedError.code === ErrorCode.NOT_FOUND) {
      throw new ApplicationError(
        ErrorCode.PROJECT_NOT_FOUND,
        "Project not found",
        { details: normalizedError.details }
      );
    }

    if (normalizedError.code === ErrorCode.UNAUTHORIZED) {
      throw new ApplicationError(
        ErrorCode.UNAUTHORIZED,
        "Invalid API key. Please check your tenant API key.",
        { details: normalizedError.details }
      );
    }

    throw new ApplicationError(
      ErrorCode.OPERATION_FAILED,
      "Failed to fetch project. Please try again later.",
      { details: normalizedError.message, originalError: normalizedError }
    );
  }
}

export async function createProject(
  apiKey: string,
  data: CreateProjectRequest
): Promise<CreateProjectResponse> {
  try {
    return await externalApiClient.post<CreateProjectResponse>(
      "/project",
      apiKey,
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
        "Invalid API key. Please check your tenant API key.",
        { details: normalizedError.details }
      );
    }

    throw new ApplicationError(
      ErrorCode.OPERATION_FAILED,
      "Failed to create project. Please try again.",
      { details: normalizedError.message, originalError: normalizedError }
    );
  }
}

export async function updateProject(
  apiKey: string,
  data: UpdateProjectRequest
): Promise<UpdateProjectResponse> {
  try {
    return await externalApiClient.put<UpdateProjectResponse>(
      "/project",
      apiKey,
      data
    );
  } catch (error) {
    const normalizedError = normalizeError(error);

    if (normalizedError.code === ErrorCode.NOT_FOUND) {
      throw new ApplicationError(
        ErrorCode.PROJECT_NOT_FOUND,
        "Project not found",
        { details: normalizedError.details }
      );
    }

    if (normalizedError.code === ErrorCode.UNAUTHORIZED) {
      throw new ApplicationError(
        ErrorCode.UNAUTHORIZED,
        "Invalid API key. Please check your tenant API key.",
        { details: normalizedError.details }
      );
    }

    throw new ApplicationError(
      ErrorCode.OPERATION_FAILED,
      "Failed to update project. Please try again.",
      { details: normalizedError.message, originalError: normalizedError }
    );
  }
}

export async function deleteProject(
  apiKey: string,
  projectName: string
): Promise<void> {
  try {
    await externalApiClient.delete("/project", apiKey, {
      projectName,
    });
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
        "Invalid API key. Please check your tenant API key.",
        { details: normalizedError.details }
      );
    }

    throw new ApplicationError(
      ErrorCode.OPERATION_FAILED,
      "Failed to delete project. Please try again.",
      { details: normalizedError.message, originalError: normalizedError }
    );
  }
}
