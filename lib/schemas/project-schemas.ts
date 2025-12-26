import * as z from "zod";

export const projectFormSchema = z.object({
  project_name: z
    .string()
    .min(1, "Project name is required")
    .regex(
      /^[a-zA-Z0-9-]+$/,
      "Project name can only contain letters, numbers, and hyphens. Spaces are not allowed."
    ),
  webhook_url: z
    .string()
    .min(1, "Webhook URL is required")
    .url("Must be a valid URL"),
});

export type ProjectFormValues = z.infer<typeof projectFormSchema>;
