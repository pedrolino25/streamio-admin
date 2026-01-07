import * as z from "zod";

export const tenantFormSchema = z.object({
  organization: z
    .string()
    .min(1, "Organization name is required")
    .regex(
      /^[a-zA-Z0-9\s-]+$/,
      "Organization name can only contain letters, numbers, spaces, and hyphens"
    ),
});

export type TenantFormValues = z.infer<typeof tenantFormSchema>;
