import { NextRequest } from "next/server";
import { verifyToken } from "./auth";

export async function getAuthToken(
  request: NextRequest
): Promise<string | null> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.substring(7);
}

export async function requireAuth(request: NextRequest) {
  const token = await getAuthToken(request);
  if (!token) {
    throw new Error("Unauthorized: No token provided");
  }

  const user = await verifyToken(token);
  if (!user) {
    throw new Error("Unauthorized: Invalid or expired token");
  }

  return { token, user };
}
