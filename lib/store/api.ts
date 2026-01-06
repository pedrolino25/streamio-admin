import { ProcessingConfiguration } from "@/lib/schemas/upload-schemas";
import { mapHttpStatusToErrorCode } from "@/lib/services/error-transformer";
import { ErrorCode } from "@/lib/types/errors";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

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

export interface Video {
  id: string;
  project_id: string;
  path?: string;
  status: "UPLOADING" | "PROCESSING" | "FAILED" | "PROCESSED";
  video_time?: number;
  file_size?: number;
  upload_start_timestamp?: string;
  processing_start_timestamp?: string;
  processing_end_timestamp?: string;
  configuration?: ProcessingConfiguration;
}

interface RtkQueryErrorData {
  code?: ErrorCode;
  message?: string;
  details?: string;
}

const baseQuery = fetchBaseQuery({ baseUrl: "" });

const baseQueryWithAuth = async (
  args: Parameters<typeof baseQuery>[0],
  api: Parameters<typeof baseQuery>[1],
  extraOptions: Parameters<typeof baseQuery>[2]
) => {
  const fetchArgs = typeof args === "string" ? { url: args } : args;
  const existingHeaders = fetchArgs?.headers;
  const headers = new Headers(
    existingHeaders instanceof Headers
      ? existingHeaders
      : existingHeaders
      ? (existingHeaders as HeadersInit)
      : undefined
  );
  const token = headers.get("X-Auth-Token");

  if (!token) {
    return {
      error: {
        status: 401,
        data: {
          code: ErrorCode.UNAUTHORIZED,
          message: "Authentication token is required",
        },
      },
    };
  }

  headers.set("Authorization", `Bearer ${token}`);
  headers.set("Content-Type", "application/json");
  headers.delete("X-Auth-Token");

  const result = await baseQuery({ ...fetchArgs, headers }, api, extraOptions);

  if (result.error) {
    const error = result.error;
    const status =
      "status" in error && typeof error.status === "number"
        ? error.status
        : 500;
    const data = (
      "data" in error ? error.data : null
    ) as RtkQueryErrorData | null;

    const errorCode = mapHttpStatusToErrorCode(status);
    const errorMessage =
      data?.message ||
      (data && typeof data === "object" && "error" in data
        ? String((data as { error?: string }).error)
        : null) ||
      `HTTP ${status}: Request failed`;

    return {
      error: {
        status,
        data: {
          code: errorCode,
          message: errorMessage,
          details: data?.details,
        },
      },
    };
  }

  return result;
};

export const api = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithAuth,
  tagTypes: ["Project", "Projects", "Videos"],
  endpoints: (builder) => ({
    getProjects: builder.query<Project[], string>({
      query: (token) => ({
        url: "/api/projects",
        headers: {
          "X-Auth-Token": token,
        },
      }),
      providesTags: ["Projects"],
    }),

    getProject: builder.query<Project, { projectName: string; token: string }>({
      query: ({ projectName, token }) => ({
        url: `/api/projects/${encodeURIComponent(projectName)}`,
        headers: {
          "X-Auth-Token": token,
        },
      }),
      providesTags: (result, error, { projectName }) => [
        { type: "Project", id: projectName },
      ],
    }),

    createProject: builder.mutation<
      CreateProjectResponse,
      { data: CreateProjectRequest; token: string }
    >({
      query: ({ data, token }) => ({
        url: "/api/projects",
        method: "POST",
        body: data,
        headers: {
          "X-Auth-Token": token,
        },
      }),
      invalidatesTags: ["Projects"],
    }),

    deleteProject: builder.mutation<void, { projectId: string; token: string }>(
      {
        query: ({ projectId, token }) => ({
          url: `/api/projects/${projectId}`,
          method: "DELETE",
          headers: {
            "X-Auth-Token": token,
          },
        }),
        invalidatesTags: (result, error, { projectId }) => [
          "Projects",
          { type: "Project", id: projectId },
        ],
      }
    ),
    getVideos: builder.query<Video[], { projectName: string; token: string }>({
      query: ({ projectName, token }) => ({
        url: `/api/projects/${encodeURIComponent(projectName)}/videos`,
        headers: {
          "X-Auth-Token": token,
        },
      }),
      providesTags: (result, error, { projectName }) => [
        { type: "Videos", id: projectName },
      ],
    }),
  }),
});

export const {
  useGetProjectsQuery,
  useGetProjectQuery,
  useCreateProjectMutation,
  useDeleteProjectMutation,
  useGetVideosQuery,
} = api;
