import { requireAuth } from "@/lib/auth-server";
import {
  deleteProject,
  getAllProjects,
} from "@/lib/repositories/project-repository-factory";
import { logger } from "@/lib/services/logger";
import { ApplicationError, ErrorCode } from "@/lib/types/errors";
import { NextRequest, NextResponse } from "next/server";

function handleApiError(error: unknown): NextResponse {
  if (error instanceof ApplicationError) {
    const statusCode = error.statusCode || 500;
    return NextResponse.json(
      {
        error: error.message,
        details: error.details,
        code: error.code,
      },
      { status: statusCode }
    );
  }

  const errorMessage = error instanceof Error ? error.message : "Unknown error";
  logger.error("Unhandled API error", error);

  return NextResponse.json(
    { error: "An unexpected error occurred", details: errorMessage },
    { status: 500 }
  );
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectName: string }> }
) {
  try {
    const { token } = await requireAuth(request);
    const { projectName } = await params;

    if (!projectName?.trim()) {
      throw new ApplicationError(
        ErrorCode.VALIDATION_ERROR,
        "Project name is required"
      );
    }

    const decodedName = decodeURIComponent(projectName.trim());
    const projects = await getAllProjects(token);
    
    const project =
      projects.find(
        (p) => p.project_name?.toLowerCase() === decodedName.toLowerCase()
      ) || projects.find((p) => p.project_id === decodedName);

    if (!project) {
      throw new ApplicationError(
        ErrorCode.NOT_FOUND,
        "Project not found"
      );
    }

    return NextResponse.json(project);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectName: string }> }
) {
  try {
    const { token } = await requireAuth(request);
    const { projectName } = await params;

    if (!projectName?.trim()) {
      throw new ApplicationError(
        ErrorCode.VALIDATION_ERROR,
        "Project name is required"
      );
    }

    const decodedName = decodeURIComponent(projectName.trim());
    const projects = await getAllProjects(token);
    
    const project =
      projects.find(
        (p) => p.project_name?.toLowerCase() === decodedName.toLowerCase()
      ) || projects.find((p) => p.project_id === decodedName);

    if (!project) {
      throw new ApplicationError(
        ErrorCode.PROJECT_NOT_FOUND,
        "Project not found"
      );
    }

    await deleteProject(project.project_id, token);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
