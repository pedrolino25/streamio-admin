import * as z from "zod";

export interface ProcessingConfiguration {
  videoQuality: "low" | "medium" | "high";
  maxResolution: "720p" | "1080p" | "source";
  thumbnailImage?: string;
  previewImages?: boolean;
}

const processingConfigurationSchema = z.object({
  videoQuality: z.enum(["low", "medium", "high"]),
  maxResolution: z.enum(["720p", "1080p", "source"]),
  thumbnailImage: z.string().optional(),
  previewImages: z.boolean().optional(),
});

export const uploadTestSchema = z.object({
  path: z.string().optional(),
  videoTitle: z
    .string()
    .max(100, "Video title must be 100 characters or less")
    .optional(),
  file: z
    .custom<File>((val) => val instanceof File, {
      message: "Please select a file",
    })
    .refine((file) => file.size > 0, "File cannot be empty"),
  configuration: processingConfigurationSchema.optional(),
});

export type UploadTestFormValues = z.infer<typeof uploadTestSchema>;
