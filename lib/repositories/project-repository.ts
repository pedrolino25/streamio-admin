import { logger } from "@/lib/services/logger";
import { ApplicationError, ErrorCode } from "@/lib/types/errors";
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  PutCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import { validateTableName } from "@/lib/utils/validation";

export interface Project {
  project_id: string;
  project_name?: string;
  webhook_url?: string;
  created_at?: string;
}

export interface ProjectRepositoryConfig {
  tableName: string;
  client: DynamoDBDocumentClient;
}

export async function findAll(
  config: ProjectRepositoryConfig
): Promise<Project[]> {
  validateTableName(config.tableName, "PROJECTS_TABLE");

  try {
    const command = new ScanCommand({
      TableName: config.tableName,
    });

    const response = await config.client.send(command);
    return (response.Items || []) as Project[];
  } catch (error) {
    logger.error("Failed to fetch projects from DynamoDB", error, {
      tableName: config.tableName,
    });

    if (error instanceof ApplicationError) {
      throw error;
    }

    throw new ApplicationError(
      ErrorCode.SERVER_ERROR,
      "Failed to retrieve projects",
      { originalError: error }
    );
  }
}

export async function create(
  config: ProjectRepositoryConfig,
  project: Project
): Promise<void> {
  validateTableName(config.tableName, "PROJECTS_TABLE");

  try {
    const command = new PutCommand({
      TableName: config.tableName,
      Item: {
        ...project,
        created_at: project.created_at || new Date().toISOString(),
      },
    });

    await config.client.send(command);
  } catch (error) {
    logger.error("Failed to create project in DynamoDB", error, {
      tableName: config.tableName,
      projectId: project.project_id,
    });

    if (error instanceof ApplicationError) {
      throw error;
    }

    throw new ApplicationError(
      ErrorCode.SERVER_ERROR,
      "Failed to create project",
      { originalError: error }
    );
  }
}

export async function deleteById(
  config: ProjectRepositoryConfig,
  projectId: string
): Promise<void> {
  validateTableName(config.tableName, "PROJECTS_TABLE");

  try {
    const command = new DeleteCommand({
      TableName: config.tableName,
      Key: {
        project_id: projectId,
      },
    });

    await config.client.send(command);
  } catch (error) {
    logger.error("Failed to delete project from DynamoDB", error, {
      tableName: config.tableName,
      projectId,
    });

    if (error instanceof ApplicationError) {
      throw error;
    }

    throw new ApplicationError(
      ErrorCode.SERVER_ERROR,
      "Failed to delete project",
      { originalError: error }
    );
  }
}

export async function nameExists(
  config: ProjectRepositoryConfig,
  projectName: string
): Promise<boolean> {
  validateTableName(config.tableName, "PROJECTS_TABLE");

  try {
    const command = new ScanCommand({
      TableName: config.tableName,
      FilterExpression: "attribute_exists(project_name)",
    });

    const response = await config.client.send(command);
    if (!response.Items) return false;

    const lowerProjectName = projectName.toLowerCase();
    return response.Items.some(
      (item) => item.project_name?.toLowerCase() === lowerProjectName
    );
  } catch (error) {
    logger.error("Failed to check project name existence", error, {
      tableName: config.tableName,
      projectName,
    });

    return false;
  }
}
