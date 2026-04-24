import UserRepository from "../../DB/repositories/user.repository";
import type { Request, Response } from "express";
import { IUpdatePasswordType } from "./user.validation";
import { Compare, Hash } from "../../common/utils/security/hash.security";
import { AppError } from "../../common/utils/global-error-handler";
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
}

export default new UserService();
