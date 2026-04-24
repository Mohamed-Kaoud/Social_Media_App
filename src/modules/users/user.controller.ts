import { Router } from "express";
import { authentication } from "../../common/middleware/authentication";
import { authorization } from "../../common/middleware/authorization";
import { RoleEnum } from "../../common/enum/user.enum";
import UserService from "./user.service"
import { validation } from "../../common/middleware/validation";
import * as UV from "./user.validation"

const userRouter = Router()

userRouter.get("/profile", authentication,authorization([RoleEnum.user]), UserService.getProfile)
userRouter.patch("/update-password", validation(UV.updatePasswordSchema),authentication, UserService.updatePassword)



export default userRouter