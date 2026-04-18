import * as z from "zod"

export const updatePasswordSchema = {
    body: z.object({
        oldPassword: z.string().min(4),
        newPassword: z.string().min(4),
        cPassword: z.string().min(4)
    }).refine((data) => {
        return data.newPassword === data.cPassword
    }, {
       error: "Confirmed password must match the new password 🔴",
       path: ["cPassword"]
    })
}

export type IUpdatePasswordType = z.infer<typeof updatePasswordSchema.body>