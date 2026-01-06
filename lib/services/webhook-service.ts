import { ApplicationError } from "@/lib/types/errors";
import { apiClient } from "./api-client";

export interface WebhookTestRequest {
  webhookUrl: string;
}

export interface WebhookTestResponse {
  status: number;
  response: unknown;
  error?: string;
}

export async function testWebhook(
  webhookUrl: string
): Promise<WebhookTestResponse> {
  try {
    return await apiClient.postUnauthenticated<WebhookTestResponse>(
      "/api/webhook-test",
      { webhookUrl: webhookUrl.trim() }
    );
  } catch (error) {
    if (error instanceof ApplicationError) {
      throw new Error(
        error.details || error.message || "Webhook test failed"
      );
    }
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Webhook test failed");
  }
}

export const webhookService = {
  testWebhook,
};
