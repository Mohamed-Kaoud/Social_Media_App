import { Router } from "express";
import AuthService from "./auth.service"
import * as authValidation from "./auth.validation"
import { validation } from "../../common/middleware/validation";
import { authentication } from "../../common/middleware/authentication";
import multerCloud from "../../common/middleware/multer.cloud";
import { Store_Enum } from "../../common/enum/multer.enum";
import chatRouter from "../chat/chat.controller";

const authRouter = Router()

authRouter.use("/:userId/chat", chatRouter)

authRouter.post("/signup", validation(authValidation.signUpSchema) ,AuthService.signUp)
authRouter.post("/resend-otp", validation(authValidation.resendOtpSchema), AuthService.resendOtp)
authRouter.patch("/confirm-email",validation(authValidation.confirmEmailSchema), AuthService.confirmEmail)
authRouter.post("/signin", validation(authValidation.signInSchema),AuthService.signIn)
authRouter.post("/signup/gmail", AuthService.signUpWithGmail)
authRouter.post("/forget-password", validation(authValidation.forgetPasswordSchema), AuthService.forgetPassword)
authRouter.patch("/reset-password", validation(authValidation.resetPasswordSchema), AuthService.resetPassword)
authRouter.post("/logout", authentication, AuthService.logOut)
authRouter.post("/upload", authentication, AuthService.upload)


export default authRouter