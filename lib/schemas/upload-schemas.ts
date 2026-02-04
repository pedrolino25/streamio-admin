import * as z from "zod";

export interface ProcessingConfiguration {
  videoQuality?: "low" | "medium" | "high";
  maxResolution?: "720p" | "1080p" | "source";
  thumbnailImage?: string;
  previewImages?: boolean;
  imageQuality?: "low" | "medium" | "high";
  imageMaxWidth?: number;
  imageMaxHeight?: number;
}

const processingConfigurationSchema = z.object({
  videoQuality: z.enum(["low", "medium", "high"]).optional(),
  maxResolution: z.enum(["720p", "1080p", "source"]).optional(),
  thumbnailImage: z.string().optional(),
  previewImages: z.boolean().optional(),
  imageQuality: z.enum(["low", "medium", "high"]).optional(),
  imageMaxWidth: z.number().optional(),
  imageMaxHeight: z.number().optional(),
});

export const uploadTestSchema = z.object({
  path: z.string().optional(),
  contentTitle: z
    .string()
    .max(100, "Content title must be 100 characters or less")
    .optional(),
  file: z
    .custom<File>((val) => val instanceof File, {
      message: "Please select a file",
    })
    .refine((file) => file.size > 0, "File cannot be empty"),
  configuration: processingConfigurationSchema.optional(),
});

export type UploadTestFormValues = z.infer<typeof uploadTestSchema>;
