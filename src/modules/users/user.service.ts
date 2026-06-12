import UserRepository from "../../DB/repositories/user.repository";
import type { Request, Response } from "express";
import { IUpdatePasswordType } from "./user.validation";
import { Compare, Hash } from "../../common/utils/security/hash.security";
import { AppError } from "../../common/utils/global-error-handler";
import TokenService from "../../common/service/token.service";
import { successResponse } from "../../common/service/response.success";
import { Types } from "mongoose";

const users = [
  { id: 1, name: "Mohamed Elsayed", age: 20, gender: "male" },
  { id: 2, name: "Ahmed Elsayed", age: 22, gender: "male" },
  { id: 3, name: "Amr Elsayed", age: 24, gender: "male" },
];

class UserService {
  private readonly _userModel = new UserRepository();
  private readonly _tokenService = TokenService;
  constructor() {}

  getProfile = async (req: Request, res: Response) => {
    const user = await this._userModel.findOne({
      filter: { _id: req.user?._id as Types.ObjectId },
      options: {
        populate: [
          {
            path: "friends",
          },
        ],
      },
    });

    successResponse({ res, data: { user } });
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

  graphQl_GetUser = async (userId: Types.ObjectId) => {
    return await this._userModel.findOne({ filter: { _id: userId } });
  };

  graphQl_GetUsers = async () => {
    return await this._userModel.find({ filter: {} });
  };
}

export default new UserService();
