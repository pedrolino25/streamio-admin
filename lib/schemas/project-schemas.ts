import * as z from "zod";

export const projectFormSchema = z.object({
  projectName: z
    .string()
    .min(1, "Project name is required")
    .regex(
      /^[a-zA-Z0-9-]+$/,
      "Project name can only contain letters, numbers, and hyphens. Spaces are not allowed."
    ),
  webhookUrl: z
    .string()
    .url("Must be a valid URL")
    .optional()
    .or(z.literal("")),
});

export type ProjectFormValues = z.infer<typeof projectFormSchema>;
