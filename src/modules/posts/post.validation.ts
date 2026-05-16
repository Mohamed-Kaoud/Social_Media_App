import * as z from "zod"
import { Allow_Comment_Enum, Availability_Enum } from "../../common/enum/post.enum"
import { generalRules } from "../../common/utils/generalRules"

export const createPostSchema = {
    body: z.object({
        content: z.string().optional(),
        attachments: z.array(generalRules.file).optional(),
        tags: z.array(generalRules.id).optional(),
        availability: z.enum(Availability_Enum).default(Availability_Enum.friends),
        allowComment: z.enum(Allow_Comment_Enum).default(Allow_Comment_Enum.allow)
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
    })
}

export const likeReactSchema = {
    params: z.object({
        postId: generalRules.id
    })
}

export const updatePostSchema = {
    body: z.object({
        content: z.string().optional(),
        attachments: z.array(generalRules.file).optional(),
        removeFiles: z.array(z.string()).optional(),
        tags: z.array(generalRules.id).optional(),
        removeTags: z.array(generalRules.id).optional(),
        availability: z.enum(Availability_Enum).default(Availability_Enum.friends),
        allowComment: z.enum(Allow_Comment_Enum).default(Allow_Comment_Enum.allow),
    }).superRefine((args,ctx) => {
        if(args?.tags?.length) {
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

    params: likeReactSchema.params
  
}

export const deletePostSchema = {
    params: z.object({
        postId: generalRules.id
    })
}