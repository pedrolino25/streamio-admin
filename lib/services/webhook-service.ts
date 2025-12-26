import { apiClient, ApiError } from "./api-client";

export interface WebhookTestRequest {
  webhookUrl: string;
}

export interface WebhookTestResponse {
  status: number;
  response: unknown;
  error?: string;
}

export class WebhookService {
  /**
   * Tests a webhook URL
   */
  async testWebhook(webhookUrl: string): Promise<WebhookTestResponse> {
    try {
      return await apiClient.postUnauthenticated<WebhookTestResponse>(
        "/api/webhook-test",
        { webhookUrl: webhookUrl.trim() }
      );
    } catch (error) {
      if (error && typeof error === "object" && "error" in error) {
        const apiError = error as ApiError;
        throw new Error(
          apiError.details || apiError.error || "Webhook test failed"
        );
      }
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Webhook test failed");
    }
  }
}

export const webhookService = new WebhookService();
