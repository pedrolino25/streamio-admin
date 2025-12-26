import * as z from "zod";

export const webhookTestSchema = z.object({
  webhookUrl: z.string().url("Must be a valid URL"),
});

export type WebhookTestFormValues = z.infer<typeof webhookTestSchema>;
