import * as z from "zod"
import { generalRules } from "../../common/utils/generalRules"
import { On_Model_Enum } from "../../common/enum/post.enum"

export const createCommentSchema = {
    body: z.object({
        content: z.string().optional(),
        attachments: z.array(generalRules.file).optional(),
        tags: z.array(generalRules.id).optional(),
        onModel: z.enum(On_Model_Enum)
    }).superRefine((args,ctx) => {
        if(!args.content && !args.attachments?.length) {
            ctx.addIssue({
                code: "custom",
                path: ["content"],
                message: "Content is required"
            })
        }
        if(args?.tags) {
            const uniqueTags = new Set(args.tags)
            if(uniqueTags.size !== args.tags.length){
                ctx.addIssue({
                    code: "custom",
                    path: ["tags"],
                    message: "Duplicated tags 🔴"
                })
            }
        }
    }),
    params: z.strictObject({
        postId: generalRules.id,
        commentId: generalRules.id.optional()
    })
}

export const getCommentsSchema = {
  params: z.strictObject({
    postId: generalRules.id,
  }),
};

export const updateCommentSchema = {
  body: z.object({
    content: z.string().optional(),
    attachments: z.array(generalRules.file).optional(),
    removeFiles: z.array(z.string()).optional(),
    tags: z.array(generalRules.id).optional(),
    removeTags: z.array(generalRules.id).optional(),
  }),

  params: z.strictObject({
    postId: generalRules.id,
    commentId: generalRules.id,
  }),
};

export const deleteCommentSchema = {
  params: z.strictObject({
    postId: generalRules.id,
    commentId: generalRules.id,
  }),
};

export const likeCommentSchema = {
  params: z.strictObject({
    postId: generalRules.id,
    commentId: generalRules.id,
  }),
};

