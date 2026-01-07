import { logger } from "@/lib/services/logger";
import { ApplicationError, ErrorCode } from "@/lib/types/errors";
import {
  DynamoDBDocumentClient,
  PutCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import { validateTableName } from "@/lib/utils/validation";

export interface Tenant {
  id: string;
  api_key: string;
  organization: string;
  status: string;
}

export interface TenantRepositoryConfig {
  tableName: string;
  client: DynamoDBDocumentClient;
}

export async function findAll(
  config: TenantRepositoryConfig
): Promise<Tenant[]> {
  validateTableName(config.tableName, "TENANTS_TABLE");

  try {
    const command = new ScanCommand({
      TableName: config.tableName,
    });

    const response = await config.client.send(command);
    return (response.Items || []) as Tenant[];
  } catch (error) {
    logger.error("Failed to fetch tenants from DynamoDB", error, {
      tableName: config.tableName,
    });

    if (error instanceof ApplicationError) {
      throw error;
    }

    throw new ApplicationError(
      ErrorCode.SERVER_ERROR,
      "Failed to retrieve tenants",
      { originalError: error }
    );
  }
}

export async function create(
  config: TenantRepositoryConfig,
  tenant: Tenant
): Promise<void> {
  validateTableName(config.tableName, "TENANTS_TABLE");

  try {
    const command = new PutCommand({
      TableName: config.tableName,
      Item: tenant,
    });

    await config.client.send(command);
  } catch (error) {
    logger.error("Failed to create tenant in DynamoDB", error, {
      tableName: config.tableName,
      tenantId: tenant.id,
    });

    if (error instanceof ApplicationError) {
      throw error;
    }

    throw new ApplicationError(
      ErrorCode.SERVER_ERROR,
      "Failed to create tenant",
      { originalError: error }
    );
  }
}

export async function apiKeyExists(
  config: TenantRepositoryConfig,
  apiKey: string
): Promise<boolean> {
  validateTableName(config.tableName, "TENANTS_TABLE");

  try {
    const command = new ScanCommand({
      TableName: config.tableName,
      FilterExpression: "api_key = :apiKey",
      ExpressionAttributeValues: {
        ":apiKey": apiKey,
      },
    });

    const response = await config.client.send(command);
    return (response.Items?.length || 0) > 0;
  } catch (error) {
    logger.error("Failed to check API key existence", error, {
      tableName: config.tableName,
      apiKey,
    });

    return false;
  }
}

