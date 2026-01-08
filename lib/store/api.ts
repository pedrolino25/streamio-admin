import { ProcessingConfiguration } from "@/lib/schemas/upload-schemas";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// Type definitions
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
  videoTitle?: string;
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

const EXTERNAL_API_BASE_URL = "https://api.stream-io.cloud";

const externalBaseQuery = fetchBaseQuery({
  baseUrl: EXTERNAL_API_BASE_URL,
});

const internalBaseQuery = fetchBaseQuery({
  baseUrl: "",
  prepareHeaders: (headers) => {
    const token = headers.get("X-Auth-Token");
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
      headers.delete("X-Auth-Token");
    }
    headers.set("Content-Type", "application/json");
    return headers;
  },
});

export const externalApi = createApi({
  reducerPath: "externalApi",
  baseQuery: externalBaseQuery,
  tagTypes: ["Project", "Projects", "Videos"],
  endpoints: (builder) => ({
    getProjects: builder.query<Project[], string>({
      query: (apiKey) => ({
        url: "/projects",
        headers: { "X-Api-Key": apiKey },
      }),
      transformResponse: (response: { data: Project[]; count: number }) =>
        response.data || [],
      providesTags: ["Projects"],
    }),

    getProject: builder.query<Project, { projectName: string; apiKey: string }>(
      {
        query: ({ projectName, apiKey }) => ({
          url: `/project?projectName=${encodeURIComponent(projectName)}`,
          headers: { "X-Api-Key": apiKey },
        }),
        providesTags: (_, __, { projectName }) => [
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
        headers: { "X-Api-Key": apiKey },
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
        headers: { "X-Api-Key": apiKey },
      }),
      invalidatesTags: (_, __, { data }) => [
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
        headers: { "X-Api-Key": apiKey },
      }),
      invalidatesTags: (_, __, { projectName }) => [
        "Projects",
        { type: "Project", id: projectName },
      ],
    }),

    getVideos: builder.query<Video[], { projectName: string; apiKey: string }>({
      query: ({ projectName, apiKey }) => ({
        url: `/videos?projectName=${encodeURIComponent(projectName)}`,
        headers: { "X-Api-Key": apiKey },
      }),
      transformResponse: (response: { data: Video[]; count: number }) =>
        response.data || [],
      providesTags: (_, __, { projectName }) => [
        { type: "Videos", id: projectName },
      ],
    }),

    updateVideo: builder.mutation<
      Video,
      { videoId: string; videoTitle: string; apiKey: string }
    >({
      query: ({ videoId, videoTitle, apiKey }) => ({
        url: "/video",
        method: "PUT",
        body: { videoId, videoTitle },
        headers: { "X-Api-Key": apiKey },
      }),
      invalidatesTags: ["Videos"],
    }),

    deleteVideo: builder.mutation<void, { videoId: string; apiKey: string }>({
      query: ({ videoId, apiKey }) => ({
        url: "/video",
        method: "DELETE",
        body: { videoId },
        headers: { "X-Api-Key": apiKey },
      }),
      invalidatesTags: ["Videos"],
    }),
  }),
});

export const internalApi = createApi({
  reducerPath: "internalApi",
  baseQuery: internalBaseQuery,
  tagTypes: ["Tenant", "Tenants"],
  endpoints: (builder) => ({
    getTenants: builder.query<Tenant[], string>({
      query: (token) => ({
        url: "/api/tenants",
        headers: { "X-Auth-Token": token },
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
        headers: { "X-Auth-Token": token },
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

// Export hooks
export const {
  useGetProjectsQuery,
  useGetProjectQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
  useGetVideosQuery,
  useUpdateVideoMutation,
  useDeleteVideoMutation,
} = externalApi;

export const {
  useGetTenantsQuery,
  useCreateTenantMutation,
  useTestWebhookMutation,
} = internalApi;
