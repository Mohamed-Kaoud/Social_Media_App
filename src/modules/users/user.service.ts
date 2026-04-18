import UserRepository from "../../DB/repositories/user.repository";
import type { Request, Response } from "express";
import { IUpdatePasswordType } from "./user.validation";
import { Compare, Hash } from "../../common/utils/security/hash.security";
import { AppError } from "../../common/utils/global-error-handler";
import { OAuth2Client, TokenPayload } from "google-auth-library";
import { ACCESS_SECRET_KEY, AUDIENCE } from "../../config/config.service";
import { ProviderEnum } from "../../common/enum/user.enum";
import { GenerateToken } from "../../common/utils/token.service";
import { randomUUID } from "node:crypto";

class UserService {
  private readonly _userModel = new UserRepository();
  constructor() {}

  getProfile = async (req: any, res: Response) => {
    res.status(200).json({ message: "Done", data: req.user });
  };

  updatePassword = async (req: any, res: Response) => {
    const { oldPassword, newPassword }: IUpdatePasswordType = req.body;

    if (!Compare({ plain_text: oldPassword, cipher_text: req.user.password })) {
      throw new AppError("Invalid old password ❎", 400);
    }

    const hashedPassword = Hash({ plain_text: newPassword });

    req.user.password = hashedPassword;
    await req.user.save();

    res.status(200).json({ message: "Password updated successfully ✅" });
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

    const access_token = GenerateToken({
      payload: { id: user._id.toString() },
      secret_key: ACCESS_SECRET_KEY,
      options: {
        jwtid: randomUUID(),
      },
    });

    res.status(200).json({
      message: `${name} signed up with gmail successfully ✅`,
      data: { access_token },
    });
  };
}

export default new UserService();
