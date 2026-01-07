import { ProcessingConfiguration } from "@/lib/schemas/upload-schemas";
import { mapHttpStatusToErrorCode } from "@/lib/services/error-transformer";
import { ErrorCode } from "@/lib/types/errors";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// Type definitions (moved from services)
export interface Project {
  id: string;
  tenantId: string;
  projectName: string;
  webhookUrl?: string;
  createdAt?: string;
  updatedAt?: string;
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

export interface Tenant {
  id: string;
  api_key: string;
  organization: string;
  status: string;
}

export interface CreateTenantRequest {
  organization: string;
}

export interface CreateTenantResponse {
  id: string;
  api_key: string;
  organization: string;
  status: string;
}

export interface Video {
  id: string;
  tenantId: string;
  projectId: string;
  path: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
  videoTime?: number;
  fileSize?: number;
  uploadStartTimestamp?: string;
  processingStartTimestamp?: string;
  processingEndTimestamp?: string;
  configuration?: ProcessingConfiguration;
}

export interface WebhookTestRequest {
  webhookUrl: string;
}

export interface WebhookTestResponse {
  status: number;
  response: unknown;
  error?: string;
}

interface RtkQueryErrorData {
  code?: ErrorCode;
  message?: string;
  details?: string;
}

// External API - uses API keys
const EXTERNAL_API_BASE_URL = "https://api.stream-io.cloud";

// Internal API - uses auth tokens
const internalApiBaseQuery = fetchBaseQuery({
  baseUrl: "",
});

// Wrapper to transform X-Auth-Token to Authorization
const internalApiBaseQueryWithTransform = async (
  args: Parameters<typeof internalApiBaseQuery>[0],
  api: Parameters<typeof internalApiBaseQuery>[1],
  extraOptions: Parameters<typeof internalApiBaseQuery>[2]
) => {
  const fetchArgs = typeof args === "string" ? { url: args } : args;
  const queryHeaders = fetchArgs.headers;

  // Extract token from headers (handle both Headers object and plain object)
  let token: string | null = null;
  if (queryHeaders instanceof Headers) {
    token = queryHeaders.get("X-Auth-Token");
  } else if (queryHeaders && typeof queryHeaders === "object") {
    const headersObj = queryHeaders as Record<string, string>;
    token = headersObj["X-Auth-Token"] || null;
  }

  // Create transformed headers
  const transformedHeaders = new Headers(
    queryHeaders instanceof Headers
      ? queryHeaders
      : queryHeaders
      ? (queryHeaders as HeadersInit)
      : undefined
  );

  if (token) {
    transformedHeaders.set("Authorization", `Bearer ${token}`);
    transformedHeaders.delete("X-Auth-Token");
  }
  transformedHeaders.set("Content-Type", "application/json");

  return internalApiBaseQuery(
    { ...fetchArgs, headers: transformedHeaders },
    api,
    extraOptions
  );
};

// Error transformer for both APIs
const transformError = <T = unknown>(result: { error?: unknown; data?: T }) => {
  if (!result.error) {
    return { data: result.data as T };
  }

  const error = result.error as { status?: number; data?: unknown };
  const status =
    "status" in error && typeof error.status === "number" ? error.status : 500;
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
};

export const externalApi = createApi({
  reducerPath: "externalApi",
  baseQuery: fetchBaseQuery({
    baseUrl: EXTERNAL_API_BASE_URL,
  }),
  tagTypes: ["Project", "Projects", "Videos"],
  endpoints: (builder) => ({
    getProjects: builder.query<Project[], string>({
      query: (apiKey) => ({
        url: "/projects",
        headers: {
          "X-Api-Key": apiKey,
        },
      }),
      transformResponse: (response: { data: Project[]; count: number }) =>
        response.data || [],
      providesTags: ["Projects"],
    }),

    getProject: builder.query<Project, { projectName: string; apiKey: string }>(
      {
        query: ({ projectName, apiKey }) => ({
          url: `/project?projectName=${encodeURIComponent(projectName)}`,
          headers: {
            "X-Api-Key": apiKey,
          },
        }),
        providesTags: (result, error, { projectName }) => [
          { type: "Project", id: projectName },
        ],
      }
    ),

    createProject: builder.mutation<
      CreateProjectResponse,
      { data: CreateProjectRequest; apiKey: string }
    >({
      query: ({ data, apiKey }) => ({
        url: "/project",
        method: "POST",
        body: data,
        headers: {
          "X-Api-Key": apiKey,
        },
      }),
      invalidatesTags: ["Projects"],
    }),

    updateProject: builder.mutation<
      UpdateProjectResponse,
      { data: UpdateProjectRequest; apiKey: string }
    >({
      query: ({ data, apiKey }) => ({
        url: "/project",
        method: "PUT",
        body: data,
        headers: {
          "X-Api-Key": apiKey,
        },
      }),
      invalidatesTags: (result, error, { data }) => [
        "Projects",
        { type: "Project", id: data.projectName },
      ],
    }),

    deleteProject: builder.mutation<
      void,
      { projectName: string; apiKey: string }
    >({
      query: ({ projectName, apiKey }) => ({
        url: "/project",
        method: "DELETE",
        body: { projectName },
        headers: {
          "X-Api-Key": apiKey,
        },
      }),
      invalidatesTags: (result, error, { projectName }) => [
        "Projects",
        { type: "Project", id: projectName },
      ],
    }),

    getVideos: builder.query<Video[], { projectName: string; apiKey: string }>({
      query: ({ projectName, apiKey }) => ({
        url: `/videos?projectName=${encodeURIComponent(projectName)}`,
        headers: {
          "X-Api-Key": apiKey,
        },
      }),
      transformResponse: (response: { data: Video[]; count: number }) =>
        response.data || [],
      providesTags: (result, error, { projectName }) => [
        { type: "Videos", id: projectName },
      ],
    }),

    deleteVideo: builder.mutation<void, { videoId: string; apiKey: string }>({
      query: ({ videoId, apiKey }) => ({
        url: "/video",
        method: "DELETE",
        body: { videoId },
        headers: {
          "X-Api-Key": apiKey,
        },
      }),
      invalidatesTags: ["Videos"],
    }),
  }),
});

// Internal API slice - for Next.js API routes
export const internalApi = createApi({
  reducerPath: "internalApi",
  baseQuery: async (args, api, extraOptions) => {
    const result = await internalApiBaseQueryWithTransform(
      args,
      api,
      extraOptions
    );
    return transformError(result);
  },
  tagTypes: ["Tenant", "Tenants"],
  endpoints: (builder) => ({
    getTenants: builder.query<Tenant[], string>({
      query: (token) => ({
        url: "/api/tenants",
        headers: {
          "X-Auth-Token": token,
        },
      }),
      providesTags: ["Tenants"],
    }),

    createTenant: builder.mutation<
      CreateTenantResponse,
      { data: CreateTenantRequest; token: string }
    >({
      query: ({ data, token }) => ({
        url: "/api/tenants",
        method: "POST",
        body: data,
        headers: {
          "X-Auth-Token": token,
        },
      }),
      invalidatesTags: ["Tenants"],
    }),

    testWebhook: builder.mutation<WebhookTestResponse, WebhookTestRequest>({
      query: (data) => ({
        url: "/api/webhook-test",
        method: "POST",
        body: data,
      }),
    }),
  }),
});

// Export hooks from external API
export const {
  useGetProjectsQuery,
  useGetProjectQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
  useGetVideosQuery,
  useDeleteVideoMutation,
} = externalApi;

// Export hooks from internal API
export const {
  useGetTenantsQuery,
  useCreateTenantMutation,
  useTestWebhookMutation,
} = internalApi;
