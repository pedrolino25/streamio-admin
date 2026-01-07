import { createDynamoDBClient } from "@/lib/services/aws-credentials";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import * as tenantRepository from "./tenant-repository";

const REGION = (process.env.NEXT_PUBLIC_AWS_REGION || "eu-west-2").trim();
const USER_POOL_ID = (
  process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || ""
).trim();
const IDENTITY_POOL_ID = (
  process.env.NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID || ""
).trim();
const TENANTS_TABLE = (process.env.TENANTS_TABLE || "").trim();

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

export function createTenantRepositoryWithAuth(
  idToken: string
): tenantRepository.TenantRepositoryConfig {
  const { client } = createDynamoDBClient(idToken, {
    region: REGION,
    userPoolId: USER_POOL_ID,
    identityPoolId: IDENTITY_POOL_ID,
  });

  return {
    tableName: TENANTS_TABLE,
    client,
  };
}

export function createTenantRepository(): tenantRepository.TenantRepositoryConfig {
  return {
    tableName: TENANTS_TABLE,
    client: defaultClient,
  };
}

export async function getAllTenants(idToken?: string) {
  const config = idToken
    ? createTenantRepositoryWithAuth(idToken)
    : createTenantRepository();
  return tenantRepository.findAll(config);
}

export async function createTenant(
  tenant: Parameters<typeof tenantRepository.create>[1],
  idToken?: string
) {
  const config = idToken
    ? createTenantRepositoryWithAuth(idToken)
    : createTenantRepository();
  return tenantRepository.create(config, tenant);
}

export async function tenantApiKeyExists(apiKey: string, idToken?: string) {
  const config = idToken
    ? createTenantRepositoryWithAuth(idToken)
    : createTenantRepository();
  return tenantRepository.apiKeyExists(config, apiKey);
}

export type { Tenant } from "./tenant-repository";

