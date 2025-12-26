import { requireAuth } from "@/lib/auth-server";
import { Project } from "@/lib/repositories/project-repository";
import {
  createProjectRepositoryWithAuth,
  getAllProjects,
  projectNameExists,
} from "@/lib/repositories/project-repository-factory";
import { logger } from "@/lib/services/logger";
import { ApplicationError, ErrorCode } from "@/lib/types/errors";
import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";

function validateProjectName(name: string): void {
  if (!name?.trim()) {
    throw new ApplicationError(
      ErrorCode.VALIDATION_ERROR,
      "project_name is required"
    );
  }

  if (!/^[a-zA-Z0-9-]+$/.test(name.trim())) {
    throw new ApplicationError(
      ErrorCode.VALIDATION_ERROR,
      "project_name can only contain letters, numbers, and hyphens. Spaces are not allowed."
    );
  }
}

function validateWebhookUrl(url: string): void {
  if (!url?.trim()) {
    throw new ApplicationError(
      ErrorCode.VALIDATION_ERROR,
      "webhook_url is required"
    );
  }

  try {
    new URL(url.trim());
  } catch {
    throw new ApplicationError(
      ErrorCode.VALIDATION_ERROR,
      "webhook_url must be a valid URL"
    );
  }
}

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

export async function GET(request: NextRequest) {
  try {
    const { token } = await requireAuth(request);
    const projects = await getAllProjects(token);
    return NextResponse.json(projects);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { token } = await requireAuth(request);
    const body = await request.json();
    const { project_name, webhook_url } = body;

    const trimmedProjectName = project_name?.trim() || "";
    const trimmedWebhookUrl = webhook_url?.trim() || "";

    validateProjectName(trimmedProjectName);
    validateWebhookUrl(trimmedWebhookUrl);

    const exists = await projectNameExists(trimmedProjectName, token);
    if (exists) {
      throw new ApplicationError(
        ErrorCode.CONFLICT,
        "A project with this name already exists"
      );
    }

    const apiKey = `sk_${randomBytes(32).toString("hex")}`;

    const project: Project = {
      project_id: apiKey,
      project_name: trimmedProjectName,
      webhook_url: trimmedWebhookUrl,
      created_at: new Date().toISOString(),
    };

    const repository = createProjectRepositoryWithAuth(token);
    await repository.create(project);

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
