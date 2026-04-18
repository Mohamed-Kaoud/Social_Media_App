import { Router } from "express";
import AuthService from "./auth.service"
import * as authValidation from "./auth.validation"
import { validation } from "../../common/middleware/validation";
import { authentication } from "../../common/middleware/authentication";

const authRouter = Router()

authRouter.post("/signup", validation(authValidation.signUpSchema) ,AuthService.signUp)
authRouter.patch("/confirm-email",validation(authValidation.confirmEmailSchema), AuthService.confirmEmail)
authRouter.post("/signin", validation(authValidation.signInSchema),AuthService.signIn)
authRouter.post("/forget-password", validation(authValidation.forgetPasswordSchema), AuthService.forgetPassword)
authRouter.post("/logout", authentication, AuthService.logOut)

export default authRouter