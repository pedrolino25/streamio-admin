import { createDynamoDBClient } from "@/lib/services/aws-credentials";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import * as projectRepository from "./project-repository";

const REGION = (process.env.NEXT_PUBLIC_AWS_REGION || "eu-west-2").trim();
const USER_POOL_ID = (
  process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || ""
).trim();
const IDENTITY_POOL_ID = (
  process.env.NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID || ""
).trim();
const PROJECTS_TABLE = (process.env.PROJECTS_TABLE || "").trim();

function createDefaultClient(): DynamoDBDocumentClient {
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
}

const defaultClient = createDefaultClient();

export function createProjectRepositoryWithAuth(
  idToken: string
): projectRepository.ProjectRepositoryConfig {
  const { client } = createDynamoDBClient(idToken, {
    region: REGION,
    userPoolId: USER_POOL_ID,
    identityPoolId: IDENTITY_POOL_ID,
  });

  return {
    tableName: PROJECTS_TABLE,
    client,
  };
}

export function createProjectRepository(): projectRepository.ProjectRepositoryConfig {
  return {
    tableName: PROJECTS_TABLE,
    client: defaultClient,
  };
}

export async function getAllProjects(idToken?: string) {
  const config = idToken
    ? createProjectRepositoryWithAuth(idToken)
    : createProjectRepository();
  return projectRepository.findAll(config);
}

export async function createProject(
  project: Parameters<typeof projectRepository.create>[1],
  idToken?: string
) {
  const config = idToken
    ? createProjectRepositoryWithAuth(idToken)
    : createProjectRepository();
  return projectRepository.create(config, project);
}

export async function deleteProject(projectId: string, idToken?: string) {
  const config = idToken
    ? createProjectRepositoryWithAuth(idToken)
    : createProjectRepository();
  return projectRepository.deleteById(config, projectId);
}

export async function projectNameExists(projectName: string, idToken?: string) {
  const config = idToken
    ? createProjectRepositoryWithAuth(idToken)
    : createProjectRepository();
  return projectRepository.nameExists(config, projectName);
}

export type { Project } from "./project-repository";
