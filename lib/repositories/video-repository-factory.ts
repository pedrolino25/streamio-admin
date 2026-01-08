import {
  createDynamoDBClient,
  handleCredentialError,
} from "@/lib/services/aws-credentials";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { VideoRepository } from "./video-repository";

const REGION = (process.env.NEXT_PUBLIC_AWS_REGION || "eu-west-2").trim();
const USER_POOL_ID = (
  process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || ""
).trim();
const IDENTITY_POOL_ID = (
  process.env.NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID || ""
).trim();
const VIDEOS_TABLE = (process.env.VIDEOS_TABLE || "").trim();

const createDefaultClient = (): DynamoDBDocumentClient => {
  const clientConfig: {
    region: string;
    credentials?: { accessKeyId: string; secretAccessKey: string };
  } = {
    region: REGION,
  };

  if (
    process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID &&
    process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY
  ) {
    clientConfig.credentials = {
      accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY,
    };
  }

  const client = new DynamoDBClient(clientConfig);
  return DynamoDBDocumentClient.from(client);
};

const defaultClient = createDefaultClient();

const awsConfig = {
  region: REGION,
  userPoolId: USER_POOL_ID,
  identityPoolId: IDENTITY_POOL_ID,
};

export function createVideoRepositoryWithAuth(
  idToken: string
): VideoRepository {
  try {
    const { client } = createDynamoDBClient(idToken, awsConfig);
    return new VideoRepository({
      tableName: VIDEOS_TABLE,
      client,
    });
  } catch (error) {
    handleCredentialError(error, "createVideoRepositoryWithAuth", awsConfig);
    throw error;
  }
}

export function createVideoRepository(): VideoRepository {
  return new VideoRepository({
    tableName: VIDEOS_TABLE,
    client: defaultClient,
  });
}

export async function getVideosByProjectId(
  projectId: string,
  idToken?: string
) {
  const repository = idToken
    ? createVideoRepositoryWithAuth(idToken)
    : createVideoRepository();
  return repository.findByProjectId(projectId);
}

export type { Video } from "./video-repository";
