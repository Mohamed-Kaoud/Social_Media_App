import type { Request, Response, NextFunction } from "express"
import { ZodType } from "zod"
import { AppError } from "../utils/global-error-handler"

type reqType = keyof Request
type schemaType = Partial<Record<reqType,ZodType>>

export const validation = (schema: schemaType) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        let validationError = []

        for (const key of Object.keys(schema) as reqType[]) {
            if(!schema[key]) continue
            if(req?.file) {
                req.body.attachment = req.file
            }
              if(req?.files) {
                req.body.attachments = req.files
            }
            const result = await schema[key].safeParseAsync(req[key])
            if(!result?.success){
                const errors = result.error.issues.map((err) => {
                    return {
                        key,
                        path: err.path[0],
                        message: err.message
                    }
                })
                validationError.push(...errors)
            }
        }

        if(validationError.length > 0) {
            throw new AppError(validationError, 400)
        }

        next()
    }
}