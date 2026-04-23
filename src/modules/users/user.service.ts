import UserRepository from "../../DB/repositories/user.repository";
import type { Request, Response } from "express";
import { IUpdatePasswordType } from "./user.validation";
import { Compare, Hash } from "../../common/utils/security/hash.security";
import { AppError } from "../../common/utils/global-error-handler";
import { OAuth2Client, TokenPayload } from "google-auth-library";
import { ACCESS_SECRET_KEY, ACCESS_SECRET_KEY_ADMIN, ACCESS_SECRET_KEY_USER, AUDIENCE } from "../../config/config.service";
import { ProviderEnum, RoleEnum } from "../../common/enum/user.enum";
import { randomUUID } from "node:crypto";
import TokenService from "../../common/utils/token.service";
import { successResponse } from "../../common/utils/response.success";

class UserService {
  private readonly _userModel = new UserRepository();
  private readonly _tokenService = TokenService;
  constructor() {}

  getProfile = async (req: Request, res: Response) => {
    successResponse({ res, data: { user: req.user } });
  };

  updatePassword = async (req: Request, res: Response) => {
    const { oldPassword, newPassword }: IUpdatePasswordType = req.body;

    if (!Compare({ plain_text: oldPassword, cipher_text: req.user.password })) {
      throw new AppError("Invalid old password ❎", 400);
    }

    const hashedPassword = Hash({ plain_text: newPassword });

    req.user.password = hashedPassword;
    await req.user.save();

    successResponse({ res, message: "Password updated successfully ✅" });
  };

  signUpWithGmail = async (req: Request, res: Response) => {
    const { idToken } = req.body;
    const client = new OAuth2Client();
    const ticket = await client.verifyIdToken({
      idToken,
      audience: AUDIENCE,
    });
    const payload = ticket.getPayload();

    const { name, email, email_verified }: any = payload;

    let user = await this._userModel.findOne({ filter: { email } });
    if (!user) {
      user = await this._userModel.create({
        userName: name,
        email,
        confirmed: email_verified,
        provider: ProviderEnum.google,
      });
    }

    if (user.provider == ProviderEnum.local) {
      throw new AppError("Please, Login with system 🔴", 400);
    }

    const access_token = this._tokenService.GenerateToken({
      payload: { id: user._id },
      secret_key: user.role == RoleEnum.user ? ACCESS_SECRET_KEY_USER : ACCESS_SECRET_KEY_ADMIN,
      options: {
        jwtid: randomUUID(),
      },
    });

    successResponse({
      res,
      message: `${name} signed up with gmail successfully ✅`,
      data: { access_token },
    });
  };
}

export default new UserService();
