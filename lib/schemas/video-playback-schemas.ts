import * as z from "zod";

export const videoPlaybackTestSchema = z.object({
  videoUrl: z.string().min(1, "Video path is required"),
});

export type VideoPlaybackTestFormValues = z.infer<
  typeof videoPlaybackTestSchema
>;
