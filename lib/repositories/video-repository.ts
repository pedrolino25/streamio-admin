import { logger } from "@/lib/services/logger";
import { ApplicationError, ErrorCode } from "@/lib/types/errors";
import { ProcessingConfiguration } from "@/lib/schemas/upload-schemas";
import {
  DynamoDBDocumentClient,
  QueryCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";

export interface Video {
  id: string;
  project_id: string; // This field stores the project name
  path?: string;
  status: "UPLOADING" | "PROCESSING" | "FAILED" | "PROCESSED";
  video_time?: number;
  file_size?: number;
  upload_start_timestamp?: string;
  processing_start_timestamp?: string;
  processing_end_timestamp?: string;
  configuration?: ProcessingConfiguration;
}

export interface VideoRepositoryConfig {
  tableName: string;
  client: DynamoDBDocumentClient;
}

export class VideoRepository {
  private readonly tableName: string;
  private readonly client: DynamoDBDocumentClient;

  constructor(config: VideoRepositoryConfig) {
    if (!config.tableName?.trim()) {
      throw new ApplicationError(
        ErrorCode.VALIDATION_ERROR,
        "VIDEOS_TABLE environment variable is not set",
        { details: "Please configure it in your .env.local file." }
      );
    }
    this.tableName = config.tableName;
    this.client = config.client;
  }

  async findByProjectId(projectId: string): Promise<Video[]> {
    try {
      const command = new QueryCommand({
        TableName: this.tableName,
        IndexName: "project_id-index", // GSI on project_id (which stores project name)
        KeyConditionExpression: "project_id = :projectId",
        ExpressionAttributeValues: {
          ":projectId": projectId,
        },
        ScanIndexForward: false, // Sort by timestamp descending
      });

      const response = await this.client.send(command);
      const videos = (response.Items || []).map(this.parseVideo) as Video[];

      // Sort by upload_start_timestamp descending
      return this.sortByUploadDate(videos);
    } catch (error) {
      logger.error("Failed to fetch videos from DynamoDB", error, {
        tableName: this.tableName,
        projectId,
      });

      // If GSI doesn't exist, fall back to scan with filter
      if (error instanceof Error && error.message.includes("index")) {
        try {
          const scanCommand = new ScanCommand({
            TableName: this.tableName,
            FilterExpression: "project_id = :projectId",
            ExpressionAttributeValues: {
              ":projectId": projectId,
            },
          });
          const response = await this.client.send(scanCommand);
          const videos = (response.Items || []).map(this.parseVideo) as Video[];

          // Sort by upload_start_timestamp descending
          return this.sortByUploadDate(videos);
        } catch (scanError) {
          logger.error("Failed to scan videos from DynamoDB", scanError, {
            tableName: this.tableName,
            projectId,
          });
          // Fall through to throw the original error
        }
      }

      if (error instanceof ApplicationError) {
        throw error;
      }

      throw new ApplicationError(
        ErrorCode.SERVER_ERROR,
        "Failed to retrieve videos",
        { originalError: error }
      );
    }
  }

  private parseVideo(video: any): Video {
    // Parse configuration if it's a string
    if (video.configuration && typeof video.configuration === "string") {
      try {
        video.configuration = JSON.parse(video.configuration);
      } catch (error) {
        logger.warn("Failed to parse video configuration", {
          videoId: video.id,
          configuration: video.configuration,
          error,
        });
        // Remove invalid configuration
        delete video.configuration;
      }
    }
    return video as Video;
  }

  private sortByUploadDate(videos: Video[]): Video[] {
    return [...videos].sort((a, b) => {
      const aTimestamp = a.upload_start_timestamp
        ? new Date(a.upload_start_timestamp).getTime()
        : 0;
      const bTimestamp = b.upload_start_timestamp
        ? new Date(b.upload_start_timestamp).getTime()
        : 0;

      // Sort descending (newest first)
      return bTimestamp - aTimestamp;
    });
  }
}
