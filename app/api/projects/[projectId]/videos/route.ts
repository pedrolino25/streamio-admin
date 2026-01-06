import { requireAuth } from "@/lib/auth-server";
import { getVideosByProjectId } from "@/lib/repositories/video-repository-factory";
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
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { token } = await requireAuth(request);
    const { projectId } = await params;

    if (!projectId?.trim()) {
      throw new ApplicationError(
        ErrorCode.VALIDATION_ERROR,
        "Project ID is required"
      );
    }

    const videos = await getVideosByProjectId(projectId, token);

    return NextResponse.json(videos);
  } catch (error) {
    return handleApiError(error);
  }
}
