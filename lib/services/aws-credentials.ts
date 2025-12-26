import { ApplicationError, ErrorCode } from "@/lib/types/errors";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { fromCognitoIdentityPool } from "@aws-sdk/credential-providers";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { logger } from "./logger";

interface AwsConfig {
  region: string;
  userPoolId: string;
  identityPoolId: string;
}

interface Credentials {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string;
}

interface DynamoDBClientWithProvider {
  client: DynamoDBDocumentClient;
  credentialsProvider: (() => Promise<Credentials>) | null;
}

export class AwsCredentialsService {
  private readonly config: AwsConfig;

  constructor(config: AwsConfig) {
    this.validateConfig(config);
    this.config = config;
  }

  private validateConfig(config: AwsConfig): void {
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

  createDynamoDBClient(idToken: string): DynamoDBClientWithProvider {
    const providerName = `cognito-idp.${this.config.region}.amazonaws.com/${this.config.userPoolId}`;

    logger.debug("Creating Cognito Identity Pool credentials provider", {
      identityPoolId: this.config.identityPoolId,
      region: this.config.region,
      userPoolId: this.config.userPoolId,
      providerName,
      hasIdToken: !!idToken,
      idTokenLength: idToken.length,
    });

    const credentialsProvider = fromCognitoIdentityPool({
      identityPoolId: this.config.identityPoolId,
      logins: {
        [providerName]: idToken,
      },
      clientConfig: {
        region: this.config.region,
      },
    });

    const client = new DynamoDBClient({
      region: this.config.region,
      credentials: credentialsProvider,
    });

    return {
      client: DynamoDBDocumentClient.from(client),
      credentialsProvider: async () => {
        const creds = await credentialsProvider();
        if (!creds.accessKeyId || !creds.secretAccessKey) {
          throw new ApplicationError(
            ErrorCode.SERVER_ERROR,
            "Failed to obtain AWS credentials: missing access key or secret"
          );
        }
        return {
          accessKeyId: creds.accessKeyId,
          secretAccessKey: creds.secretAccessKey,
          sessionToken: creds.sessionToken || "",
        };
      },
    };
  }

  handleCredentialError(error: unknown, context: string): never {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorObj = error as Record<string, unknown>;
    const awsErrorCode =
      (typeof errorObj?.Code === "string" ? errorObj.Code : null) ||
      (typeof errorObj?.code === "string" ? errorObj.code : null) ||
      (error instanceof Error ? error.name : "");
    const awsErrorMetadata = errorObj?.$metadata;

    const errorContext: Record<string, unknown> = {
      context,
      error: errorMessage,
      errorName: error instanceof Error ? error.name : "Unknown",
      awsErrorCode,
      identityPoolId: this.config.identityPoolId,
      region: this.config.region,
      userPoolId: this.config.userPoolId,
      providerName: `cognito-idp.${this.config.region}.amazonaws.com/${this.config.userPoolId}`,
    };

    if (awsErrorMetadata) {
      errorContext.awsMetadata = awsErrorMetadata;
    }

    try {
      errorContext.errorStringified = JSON.stringify(
        error,
        Object.getOwnPropertyNames(error)
      );
    } catch {
      errorContext.errorStringified = String(error);
    }

    logger.error("Error obtaining Cognito credentials", error, errorContext);

    const isProviderNameMismatch =
      (awsErrorCode === "InvalidIdentityPoolConfigurationException" ||
        errorMessage.includes("InvalidIdentityPoolConfiguration")) &&
      (errorMessage.includes("provider") ||
        errorMessage.includes("provider_name"));

    if (isProviderNameMismatch) {
      const providerName = `cognito-idp.${this.config.region}.amazonaws.com/${this.config.userPoolId}`;
      throw new ApplicationError(
        ErrorCode.SERVER_ERROR,
        `Identity Pool configuration mismatch. Expected provider_name: ${providerName}`,
        {
          details: `The Identity Pool '${this.config.identityPoolId}' exists, but the provider_name doesn't match.`,
          originalError: error,
        }
      );
    }

    throw new ApplicationError(
      ErrorCode.SERVER_ERROR,
      `Failed to obtain AWS credentials from Cognito Identity Pool${
        context ? ` (${context})` : ""
      }`,
      {
        details: `Error: ${errorMessage}\nError Code: ${
          awsErrorCode || "Unknown"
        }`,
        originalError: error,
      }
    );
  }
}
