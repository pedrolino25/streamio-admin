import { ApplicationError, ErrorCode } from "@/lib/types/errors";

export function validateProjectId(projectId: string | null | undefined): void {
  if (!projectId?.trim()) {
    throw new ApplicationError(
      ErrorCode.VALIDATION_ERROR,
      "Project ID is required"
    );
  }
}

export function validateProjectName(projectName: string | null | undefined): void {
  if (!projectName?.trim()) {
    throw new ApplicationError(
      ErrorCode.VALIDATION_ERROR,
      "Project name is required"
    );
  }
}

export function validateWebhookUrl(webhookUrl: string | null | undefined): void {
  if (!webhookUrl?.trim()) {
    throw new ApplicationError(
      ErrorCode.VALIDATION_ERROR,
      "Webhook URL is required"
    );
  }
}

export function validateIdToken(idToken: string | null | undefined): void {
  if (!idToken) {
    throw new ApplicationError(
      ErrorCode.UNAUTHORIZED,
      "Authentication token is required",
      { statusCode: 401 }
    );
  }
}

export function validateTableName(tableName: string | null | undefined, envVarName: string): void {
  if (!tableName?.trim()) {
    throw new ApplicationError(
      ErrorCode.VALIDATION_ERROR,
      `${envVarName} environment variable is not set`,
      { details: "Please configure it in your .env.local file." }
    );
  }
}

export function validateAwsConfig(config: {
  userPoolId: string | null | undefined;
  identityPoolId: string | null | undefined;
}): void {
  if (!config.userPoolId?.trim()) {
    throw new ApplicationError(
      ErrorCode.VALIDATION_ERROR,
      "NEXT_PUBLIC_COGNITO_USER_POOL_ID is not set",
      {
        details:
          "Please check your environment variables in Vercel Project Settings.",
      }
    );
  }

  if (!config.identityPoolId?.trim()) {
    throw new ApplicationError(
      ErrorCode.VALIDATION_ERROR,
      "NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID is not set",
      {
        details:
          "Please check your environment variables in Vercel Project Settings.",
      }
    );
  }

  if (
    !config.identityPoolId.includes(":") ||
    config.identityPoolId.split(":").length !== 2
  ) {
    throw new ApplicationError(
      ErrorCode.VALIDATION_ERROR,
      `Invalid Identity Pool ID format: "${config.identityPoolId}"`,
      {
        details:
          'Expected format: "region:uuid" (e.g., "eu-west-2:ce6c7cec-519a-4ba5-b1d6-0f9fd1132bfc")',
      }
    );
  }
}

