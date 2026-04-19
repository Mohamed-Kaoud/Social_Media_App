import { HydratedDocument } from "mongoose";
import { AppError } from "../../common/utils/global-error-handler";
import UserRepository from "../../DB/repositories/user.repository";
import type { Request, Response } from "express";
import { IUser } from "../../DB/models/user.model";
import { Compare, Hash } from "../../common/utils/security/hash.security";
import { Encrypt } from "../../common/utils/security/encrypt.security";
import { generateOtp, sendEmail } from "../../common/utils/email/send.email";
import { emailTemplate } from "../../common/utils/email/email.template";
import {
  IConfirmEmailType,
  IForgetPasswordType,
  ISignInType,
  ISignUpType,
} from "./auth.validation";
import { ProviderEnum } from "../../common/enum/user.enum";
import { randomUUID } from "node:crypto";
import { GenerateToken } from "../../common/utils/token.service";
import { ACCESS_SECRET_KEY, AUDIENCE } from "../../config/config.service";
import { eventEmitter } from "../../common/utils/email/email.events";
import { EmailEnum } from "../../common/enum/email.enum";
import {
  deleteKey,
  get,
  incr,
  max_otp_key,
  otp_key,
  revoked_key,
  setValue,
} from "../../DB/redis/redis.service";

class AuthService {
  private readonly _userModel = new UserRepository();

  constructor() {}

  signUp = async (req: Request, res: Response) => {
    let {
      userName,
      email,
      password,
      age,
      phone,
      address,
      gender,
      role,
    }: ISignUpType = req.body;
    const emailExist = await this._userModel.findOne({ filter: { email } });
    if (emailExist) {
      throw new AppError("Email already exist 🔴", 409);
    }

    const user: HydratedDocument<IUser> = await this._userModel.create({
      userName,
      email,
      password: Hash({ plain_text: password }),
      age,
      phone: phone ? Encrypt(phone) : undefined,
      address,
      gender,
      role,
    } as Partial<IUser>);

    const otp = await generateOtp();

    eventEmitter.emit(EmailEnum.confirmEmail, async () => {
      await sendEmail({
        to: email,
        subject: "Email Confirmation ✅",
        html: emailTemplate(otp),
      });
      await setValue({
        key: otp_key({ email: email }),
        value: Hash({ plain_text: `${otp}` }),
        ttl: 60 * 2,
      });
      await setValue({
        key: max_otp_key(email),
        value: 1,
        ttl: 60 * 6,
      });
    });
    res
      .status(201)
      .json({ message: `${userName} signed up successfully ✅`, data: user });
  };

  confirmEmail = async (req: Request, res: Response) => {
    const { email, code }: IConfirmEmailType = req.body;

    const otpValue = await get(otp_key({ email }));

    if (!otpValue) {
      throw new Error(`OTP is expired 🔴`, { cause: 404 });
    }
    if (!Compare({ plain_text: code, cipher_text: otpValue })) {
      throw new Error(`Invalid OTP ❎`, { cause: 400 });
    }

    const user = await this._userModel.findOneAndUpdate({
      filter: {
        email,
        provider: ProviderEnum.local,
        confirmed: { $exists: false },
      },
      update: { confirmed: true },
    });
    if (!user) {
      throw new AppError("Invalid email or already confirmed 🔴", 400);
    }

    await deleteKey(otp_key({ email, subject: EmailEnum.confirmEmail }));

    res
      .status(200)
      .json({ message: `Email: ${email} confirmed successfully ✅` });
  };

  signIn = async (req: Request, res: Response) => {
    const { email, password }: ISignInType = req.body;

    const user = await this._userModel.findOne({
      filter: {
        email,
        provider: ProviderEnum.local,
        confirmed: { $exists: true },
      },
    });

    if (!user) {
      throw new AppError("Invalid email or not confirmed ❎", 400);
    }

    if (!Compare({ plain_text: password, cipher_text: user.password })) {
      throw new AppError("Invalid password ❎", 400);
    }
    const jwtid = randomUUID();
    const access_token = GenerateToken({
      payload: { id: user._id },
      secret_key: ACCESS_SECRET_KEY,
      options: {
        expiresIn: 60 * 5,
        jwtid,
      },
    });
    res.status(200).json({
      message: "User signed in successfully ✅",
      data: { access_token },
    });
  };

  forgetPassword = async (req: Request, res: Response) => {
    const { email }: IForgetPasswordType = req.body;
    const user = await this._userModel.findOne({
      filter: {
        email,
        provider: ProviderEnum.local,
        confirmed: { $exists: true },
      },
    });
    if (!user) {
      throw new AppError("User not exist or account not confirmed ❎", 404);
    }

    const otp = await generateOtp();

    await sendEmail({
      to: email,
      subject: "Forget Password OTP",
      html: emailTemplate(otp),
    });

    await setValue({
      key: otp_key({ email, subject: EmailEnum.forgetPassword }),
      value: Hash({ plain_text: `${otp}` }),
      ttl: 60 * 2,
    });
    await incr(max_otp_key(email));

    res.status(200).json({ message: "Done ✅" });
  };

  logOut = async (req: any, res: Response) => {
    const {flag} = req.query
    if(flag == "all") {
      req.user.changeCredential = new Date()
      await req.user.save()
    }else {
      await setValue({
        key: revoked_key({userId: req.user._id, jti: req.decoded.jti}),
        value: req.decoded.jti,
        ttl: req.decoded.exp - Math.floor(Date.now() / 1000) 
      })
    }

    res.status(200).json({message: "Done"})

  }
 
}

export default new AuthService();
