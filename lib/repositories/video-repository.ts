import { logger } from "@/lib/services/logger";
import { ApplicationError, ErrorCode } from "@/lib/types/errors";
import { ProcessingConfiguration } from "@/lib/schemas/upload-schemas";
import {
  DynamoDBDocumentClient,
  QueryCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import {
  parseVideoConfiguration,
  sortVideosByUploadDate,
  VideoData,
  ParsedVideo,
} from "@/lib/utils/video-transforms";
import { validateTableName } from "@/lib/utils/validation";

export interface Video {
  id: string;
  project_id: string;
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

export async function findByProjectId(
  config: VideoRepositoryConfig,
  projectId: string
): Promise<Video[]> {
  validateTableName(config.tableName, "VIDEOS_TABLE");

  try {
    const command = new QueryCommand({
      TableName: config.tableName,
      IndexName: "project_id-index",
      KeyConditionExpression: "project_id = :projectId",
      ExpressionAttributeValues: {
        ":projectId": projectId,
      },
      ScanIndexForward: false,
    });

    const response = await config.client.send(command);
    const videos = (response.Items || [])
      .map((item) => parseVideoConfiguration(item as VideoData))
      .map((video) => video as Video);

    return sortVideosByUploadDate(videos);
  } catch (error) {
    logger.error("Failed to fetch videos from DynamoDB", error, {
      tableName: config.tableName,
      projectId,
    });

    if (error instanceof Error && error.message.includes("index")) {
      try {
        const scanCommand = new ScanCommand({
          TableName: config.tableName,
          FilterExpression: "project_id = :projectId",
          ExpressionAttributeValues: {
            ":projectId": projectId,
          },
        });
        const response = await config.client.send(scanCommand);
        const videos = (response.Items || [])
          .map((item) => parseVideoConfiguration(item as VideoData))
          .map((video) => video as Video);

        return sortVideosByUploadDate(videos);
      } catch (scanError) {
        logger.error("Failed to scan videos from DynamoDB", scanError, {
          tableName: config.tableName,
          projectId,
        });
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
