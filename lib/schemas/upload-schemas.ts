import * as z from "zod";

export const uploadTestSchema = z.object({
  path: z.string().optional(),
  file: z
    .custom<File>((val) => val instanceof File, {
      message: "Please select a file",
    })
    .refine((file) => file.size > 0, "File cannot be empty"),
});

export type UploadTestFormValues = z.infer<typeof uploadTestSchema>;
