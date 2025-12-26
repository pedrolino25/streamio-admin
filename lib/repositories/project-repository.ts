import { logger } from "@/lib/services/logger";
import { ApplicationError, ErrorCode } from "@/lib/types/errors";
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  PutCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";

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

export class ProjectRepository {
  private readonly tableName: string;
  private readonly client: DynamoDBDocumentClient;

  constructor(config: ProjectRepositoryConfig) {
    if (!config.tableName?.trim()) {
      throw new ApplicationError(
        ErrorCode.VALIDATION_ERROR,
        "PROJECTS_TABLE environment variable is not set",
        { details: "Please configure it in your .env.local file." }
      );
    }
    this.tableName = config.tableName;
    this.client = config.client;
  }

  async findAll(): Promise<Project[]> {
    try {
      const command = new ScanCommand({
        TableName: this.tableName,
      });

      const response = await this.client.send(command);
      return (response.Items || []) as Project[];
    } catch (error) {
      logger.error("Failed to fetch projects from DynamoDB", error, {
        tableName: this.tableName,
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

  async create(project: Project): Promise<void> {
    try {
      const command = new PutCommand({
        TableName: this.tableName,
        Item: {
          ...project,
          created_at: project.created_at || new Date().toISOString(),
        },
      });

      await this.client.send(command);
    } catch (error) {
      logger.error("Failed to create project in DynamoDB", error, {
        tableName: this.tableName,
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

  async deleteById(projectId: string): Promise<void> {
    try {
      const command = new DeleteCommand({
        TableName: this.tableName,
        Key: {
          project_id: projectId,
        },
      });

      await this.client.send(command);
    } catch (error) {
      logger.error("Failed to delete project from DynamoDB", error, {
        tableName: this.tableName,
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

  async nameExists(projectName: string): Promise<boolean> {
    try {
      const command = new ScanCommand({
        TableName: this.tableName,
        FilterExpression: "attribute_exists(project_name)",
      });

      const response = await this.client.send(command);
      if (!response.Items) return false;

      const lowerProjectName = projectName.toLowerCase();
      return response.Items.some(
        (item) => item.project_name?.toLowerCase() === lowerProjectName
      );
    } catch (error) {
      logger.error("Failed to check project name existence", error, {
        tableName: this.tableName,
        projectName,
      });

      return false;
    }
  }
}
