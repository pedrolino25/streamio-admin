import { requireAuth } from "@/lib/auth-server";
import {
  createTenant,
  getAllTenants,
  tenantApiKeyExists,
} from "@/lib/repositories/tenant-repository-factory";
import { logger } from "@/lib/services/logger";
import { Tenant } from "@/lib/store/api";
import { ApplicationError, ErrorCode } from "@/lib/types/errors";
import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";

function validateOrganizationName(name: string): void {
  if (!name?.trim()) {
    throw new ApplicationError(
      ErrorCode.VALIDATION_ERROR,
      "organization is required"
    );
  }

  if (!/^[a-zA-Z0-9\s-]+$/.test(name.trim())) {
    throw new ApplicationError(
      ErrorCode.VALIDATION_ERROR,
      "organization can only contain letters, numbers, spaces, and hyphens"
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
    const tenants = await getAllTenants(token);
    return NextResponse.json(tenants);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { token } = await requireAuth(request);
    const body = await request.json();
    const { organization } = body;

    const trimmedOrganization = organization?.trim() || "";

    validateOrganizationName(trimmedOrganization);

    let apiKey: string;
    let attempts = 0;
    const maxAttempts = 5;

    do {
      const randomPart = randomBytes(24).toString("hex");
      apiKey = `sk_${randomPart}`;
      attempts++;

      if (attempts > maxAttempts) {
        throw new ApplicationError(
          ErrorCode.SERVER_ERROR,
          "Failed to generate unique API key after multiple attempts"
        );
      }
    } while (await tenantApiKeyExists(apiKey, token));

    const tenant: Tenant = {
      id: crypto.randomUUID(),
      apiKey: apiKey,
      organization: trimmedOrganization,
      status: "active",
    };

    await createTenant(tenant, token);

    return NextResponse.json(tenant, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
