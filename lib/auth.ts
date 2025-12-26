import {
  AuthFlowType,
  ChallengeNameType,
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  InitiateAuthCommandOutput,
  RespondToAuthChallengeCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { fromCognitoIdentityPool } from "@aws-sdk/credential-providers";

const USER_POOL_ID = (
  process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || ""
).trim();
const CLIENT_ID = (process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || "").trim();
const IDENTITY_POOL_ID = (
  process.env.NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID || ""
).trim();
const REGION = (process.env.NEXT_PUBLIC_AWS_REGION || "eu-west-2").trim();

const STORAGE_KEY = "auth_data";

export interface AuthUser {
  email: string;
  sub: string;
}

export interface AuthSession {
  accessToken: string;
  idToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface NewPasswordRequiredChallenge {
  session: string;
  email: string;
}

interface StoredAuthData {
  session: AuthSession;
  user: AuthUser;
}

function createCognitoClient(): CognitoIdentityProviderClient {
  return new CognitoIdentityProviderClient({ region: REGION });
}

function validateConfig(): void {
  if (!USER_POOL_ID || !CLIENT_ID) {
    throw new Error(
      "Cognito configuration missing. Please set NEXT_PUBLIC_COGNITO_USER_POOL_ID and NEXT_PUBLIC_COGNITO_CLIENT_ID"
    );
  }
}

export function getUserFromIdToken(idToken: string): AuthUser | null {
  try {
    const base64Url = idToken.split(".")[1];
    if (!base64Url) return null;

    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );

    const payload = JSON.parse(jsonPayload);
    const now = Math.floor(Date.now() / 1000);

    if (payload.exp && payload.exp < now) {
      return null;
    }

    return {
      email: payload.email || payload["cognito:username"] || "",
      sub: payload.sub || "",
    };
  } catch (error) {
    console.error("Error extracting user from token:", error);
    return null;
  }
}

function createSessionFromResult(
  result: InitiateAuthCommandOutput["AuthenticationResult"]
): AuthSession | null {
  if (!result?.AccessToken || !result.IdToken || !result.RefreshToken) {
    return null;
  }

  return {
    accessToken: result.AccessToken,
    idToken: result.IdToken,
    refreshToken: result.RefreshToken,
    expiresAt: Date.now() + (result.ExpiresIn || 3600) * 1000,
  };
}

function handleAuthError(error: unknown): never {
  if (error && typeof error === "object" && "name" in error) {
    const awsError = error as { name: string; message?: string };

    switch (awsError.name) {
      case "NotAuthorizedException":
        throw new Error("Incorrect email or password");
      case "UserNotConfirmedException":
        throw new Error("User account is not confirmed");
      case "InvalidPasswordException":
        throw new Error(
          "Password does not meet requirements. Must be at least 8 characters with uppercase, lowercase, numbers, and symbols."
        );
      case "TooManyRequestsException":
        throw new Error("Too many attempts. Please try again later.");
      default:
        throw new Error(awsError.message || "Authentication failed");
    }
  }
  throw new Error("Authentication failed");
}

export async function signIn(
  email: string,
  password: string
): Promise<AuthSession | NewPasswordRequiredChallenge> {
  validateConfig();

  const client = createCognitoClient();
  const command = new InitiateAuthCommand({
    AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
    ClientId: CLIENT_ID,
    AuthParameters: {
      USERNAME: email,
      PASSWORD: password,
    },
  });

  try {
    const response = await client.send(command);

    if (
      response.ChallengeName === ChallengeNameType.NEW_PASSWORD_REQUIRED &&
      response.Session &&
      response.ChallengeParameters
    ) {
      return {
        session: response.Session,
        email: response.ChallengeParameters.USERNAME || email,
      };
    }

    const session = createSessionFromResult(response.AuthenticationResult);
    if (!session) {
      throw new Error("Authentication failed: Invalid response");
    }

    return session;
  } catch (error) {
    handleAuthError(error);
  }
}

export async function respondToNewPasswordChallenge(
  session: string,
  email: string,
  newPassword: string
): Promise<AuthSession> {
  validateConfig();

  const client = createCognitoClient();
  const command = new RespondToAuthChallengeCommand({
    ClientId: CLIENT_ID,
    ChallengeName: ChallengeNameType.NEW_PASSWORD_REQUIRED,
    Session: session,
    ChallengeResponses: {
      USERNAME: email,
      NEW_PASSWORD: newPassword,
    },
  });

  try {
    const response = await client.send(command);
    const authSession = createSessionFromResult(response.AuthenticationResult);

    if (!authSession) {
      throw new Error("Failed to set new password: Invalid response");
    }

    return authSession;
  } catch (error) {
    handleAuthError(error);
  }
}

export async function refreshSession(
  refreshToken: string
): Promise<AuthSession> {
  validateConfig();

  const client = createCognitoClient();
  const command = new InitiateAuthCommand({
    AuthFlow: AuthFlowType.REFRESH_TOKEN_AUTH,
    ClientId: CLIENT_ID,
    AuthParameters: {
      REFRESH_TOKEN: refreshToken,
    },
  });

  try {
    const response = await client.send(command);
    const session = createSessionFromResult(response.AuthenticationResult);

    if (!session) {
      throw new Error("Failed to refresh session: Invalid response");
    }

    return session;
  } catch (error) {
    handleAuthError(error);
  }
}

export const storage = {
  get(): StoredAuthData | null {
    if (typeof window === "undefined") return null;

    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return null;

      const parsed = JSON.parse(data) as StoredAuthData;

      if (parsed.session.expiresAt < Date.now()) {
        this.clear();
        return null;
      }

      return parsed;
    } catch {
      this.clear();
      return null;
    }
  },

  set(session: AuthSession, user: AuthUser): void {
    if (typeof window === "undefined") return;

    try {
      const data: StoredAuthData = { session, user };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error("Error storing auth data:", error);
    }
  },

  clear(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(STORAGE_KEY);
  },
};

export function signOut(): void {
  storage.clear();
}

export async function getAwsCredentials(idToken: string): Promise<{
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string;
}> {
  if (!IDENTITY_POOL_ID) {
    throw new Error(
      `NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID is not set. ` +
        `Please check your environment variables in Vercel Project Settings.`
    );
  }

  if (!USER_POOL_ID) {
    throw new Error(
      `NEXT_PUBLIC_COGNITO_USER_POOL_ID is not set. ` +
        `Please check your environment variables in Vercel Project Settings.`
    );
  }

  const providerName = `cognito-idp.${REGION}.amazonaws.com/${USER_POOL_ID}`;

  const credentialsProvider = fromCognitoIdentityPool({
    identityPoolId: IDENTITY_POOL_ID,
    logins: {
      [providerName]: idToken,
    },
    clientConfig: {
      region: REGION,
    },
  });

  try {
    const credentials = await credentialsProvider();

    if (!credentials.accessKeyId || !credentials.secretAccessKey) {
      throw new Error("Failed to obtain AWS credentials");
    }

    return {
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
      sessionToken: credentials.sessionToken || "",
    };
  } catch (error) {
    throw error;
  }
}

export async function verifyToken(token: string): Promise<AuthUser | null> {
  return getUserFromIdToken(token);
}
