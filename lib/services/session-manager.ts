import { AuthSession, getUserFromIdToken, refreshSession } from "@/lib/auth";
import { logger } from "./logger";

const REFRESH_THRESHOLD = 5 * 60 * 1000;

export interface SessionState {
  session: AuthSession;
  user: ReturnType<typeof getUserFromIdToken>;
}

export function shouldRefreshSession(session: AuthSession): boolean {
  const now = Date.now();
  return session.expiresAt - now < REFRESH_THRESHOLD;
}

export async function refreshSessionIfNeeded(
  currentSession: AuthSession
): Promise<SessionState | null> {
  if (!shouldRefreshSession(currentSession)) {
    return {
      session: currentSession,
      user: getUserFromIdToken(currentSession.idToken),
    };
  }

  try {
    const refreshed = await refreshSession(currentSession.refreshToken);
    const user = getUserFromIdToken(refreshed.idToken);

    if (!user) {
      logger.warn("Failed to extract user from refreshed token");
      return null;
    }

    return {
      session: refreshed,
      user,
    };
  } catch (error) {
    logger.error("Error refreshing session", error);
    return null;
  }
}
