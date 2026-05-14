import * as z from "zod"
import { createCommentSchema } from "./comment.validation"

export type createCommentDTO = z.infer<typeof createCommentSchema.body>



