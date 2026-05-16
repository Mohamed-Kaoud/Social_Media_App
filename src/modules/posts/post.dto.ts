import * as z from "zod"
import { createPostSchema, deletePostSchema, likeReactSchema, updatePostSchema } from "./post.validation"

export type createPostDto = z.infer<typeof createPostSchema.body>
export type updatePostDto = z.infer<typeof updatePostSchema.body>
export type deletePostDto = z.infer<typeof deletePostSchema.params>

