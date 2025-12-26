import { AwsCredentialsService } from "@/lib/services/aws-credentials";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { ProjectRepository } from "./project-repository";

const REGION = (process.env.NEXT_PUBLIC_AWS_REGION || "eu-west-2").trim();
const USER_POOL_ID = (
  process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || ""
).trim();
const IDENTITY_POOL_ID = (
  process.env.NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID || ""
).trim();
const PROJECTS_TABLE = (process.env.PROJECTS_TABLE || "").trim();

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

export function createProjectRepositoryWithAuth(
  idToken: string
): ProjectRepository {
  const credentialsService = new AwsCredentialsService({
    region: REGION,
    userPoolId: USER_POOL_ID,
    identityPoolId: IDENTITY_POOL_ID,
  });

  try {
    const { client } = credentialsService.createDynamoDBClient(idToken);
    return new ProjectRepository({
      tableName: PROJECTS_TABLE,
      client,
    });
  } catch (error) {
    credentialsService.handleCredentialError(
      error,
      "createProjectRepositoryWithAuth"
    );
    throw error;
  }
}

export function createProjectRepository(): ProjectRepository {
  return new ProjectRepository({
    tableName: PROJECTS_TABLE,
    client: defaultClient,
  });
}

export async function getAllProjects(idToken?: string) {
  const repository = idToken
    ? createProjectRepositoryWithAuth(idToken)
    : createProjectRepository();
  return repository.findAll();
}

export async function createProject(
  project: Parameters<ProjectRepository["create"]>[0],
  idToken?: string
) {
  const repository = idToken
    ? createProjectRepositoryWithAuth(idToken)
    : createProjectRepository();
  return repository.create(project);
}

export async function deleteProject(projectId: string, idToken?: string) {
  const repository = idToken
    ? createProjectRepositoryWithAuth(idToken)
    : createProjectRepository();
  return repository.deleteById(projectId);
}

export async function projectNameExists(projectName: string, idToken?: string) {
  const repository = idToken
    ? createProjectRepositoryWithAuth(idToken)
    : createProjectRepository();
  return repository.nameExists(projectName);
}

export type { Project } from "./project-repository";
