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
  confirmEmailDto,
  forgetPasswordDto,
  resendOtpDto,
  signInDto,
  signUpDto,
} from "./auth.validation";
import { ProviderEnum, RoleEnum } from "../../common/enum/user.enum";
import { randomUUID } from "node:crypto";
import {
  ACCESS_SECRET_KEY_ADMIN,
  ACCESS_SECRET_KEY_USER,
  AUDIENCE,
  REFRESH_SECRET_KEY_ADMIN,
  REFRESH_SECRET_KEY_USER,
} from "../../config/config.service";
import { eventEmitter } from "../../common/utils/email/email.events";
import { EmailEnum } from "../../common/enum/email.enum";
import { successResponse } from "../../common/utils/response.success";
import redisService from "../../common/service/redis.service";
import tokenService from "../../common/utils/token.service";
import { OAuth2Client, TokenPayload } from "google-auth-library";


class AuthService {
  private readonly _userModel = new UserRepository();

  constructor() {}

   sendEmailOtp = async ({
    email,
    subject,
  }: {
    email: string;
    subject: EmailEnum;
  }) => {
    const isBlocked = (await redisService.ttl(
      redisService.block_otp_key(email),
    )) as number;
    if (isBlocked > 0) {
      throw new AppError(
        `You are blocked yet, Try again after ${isBlocked} seconds 🔴`,
        400,
      );
    }

    const otpTTL = (await redisService.ttl(
      redisService.otp_key({ email, subject }),
    )) as number;
    if (otpTTL > 0) {
      throw new AppError(
        `We can resend OTP again after ${otpTTL} seconds`,
        400,
      );
    }

    const maxOTP = await redisService.get(redisService.max_otp_key(email));
    if (maxOTP >= 3) {
      await redisService.setValue({
        key: redisService.block_otp_key(email),
        value: "1",
        ttl: 60,
      });
      await redisService.deleteKey(redisService.max_otp_key(email));
      throw new AppError(
        `You have exceeded the maximum number of tries 🔴`,
        400,
      );
    }

    const otp = await generateOtp();

    eventEmitter.emit(EmailEnum.confirmEmail, async () => {
      await sendEmail({
        to: email,
        subject: "Welcome to Social App🤩",
        html: emailTemplate(otp),
      });
      await redisService.setValue({
        key: redisService.otp_key({ email, subject }),
        value: Hash({ plain_text: `${otp}` }),
        ttl: 60 * 2,
      });

      await redisService.incr(redisService.max_otp_key(email));
    });
  };

  resendOtp = async (req:Request, res:Response) => {
    const {email}: resendOtpDto = req.body
    const user = await this._userModel.findOne({filter: {
      email,
      confirmed: {$exists: false},
      provider: ProviderEnum.local
    }})
    if(!user) {
      throw new AppError("User not exist or already confirmed ❎", 400)
    }
    await this.sendEmailOtp({email, subject: EmailEnum.confirmEmail})

    successResponse({res})
  }

  signUp = async (req: Request, res: Response) => {
    let {
      firstName,
      lastName,
      email,
      password,
      age,
      phone,
      address,
      gender,
      role,
    }: signUpDto = req.body;
    const emailExist = await this._userModel.findOne({ filter: { email } });
    if (emailExist) {
      throw new AppError("Email already exist 🔴", 409);
    }

    const user: HydratedDocument<IUser> = await this._userModel.create({
      firstName,
      lastName,
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
      await redisService.setValue({
        key: redisService.otp_key({ email: email }),
        value: Hash({ plain_text: `${otp}` }),
        ttl: 60 * 2,
      });
      await redisService.setValue({
        key: redisService.max_otp_key(email),
        value: "1",
        ttl: 60 * 6,
      });
    });
    successResponse({
      res,
      status: 201,
      message: `${firstName} ${lastName} signed up successfully ✅`,
      data: user,
    });
  };

  confirmEmail = async (req: Request, res: Response) => {
    const { email, code }: confirmEmailDto = req.body;

    const otpValue = await redisService.get(
      redisService.otp_key({ email }),
    );

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

    await redisService.deleteKey(
      redisService.otp_key({ email, subject: EmailEnum.confirmEmail }),
    );

    successResponse({ res, message: `${email} confirmed successfully ✅` });
  };

  signIn = async (req: Request, res: Response) => {
    const { email, password }: signInDto = req.body;

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
    const access_token = tokenService.GenerateToken({
      payload: { id: user._id },
      secret_key:
        user.role == RoleEnum.user
          ? ACCESS_SECRET_KEY_USER
          : ACCESS_SECRET_KEY_ADMIN,
      options: {
        expiresIn: "1day",
        jwtid,
      },
    });
    const refresh_token = tokenService.GenerateToken({
      payload: { id: user._id },
      secret_key:
        user.role == RoleEnum.user
          ? REFRESH_SECRET_KEY_USER
          : REFRESH_SECRET_KEY_ADMIN,
      options: {
        expiresIn: "1day",
        jwtid,
      },
    });
    successResponse({
      res,
      message: `${user.firstName} ${user.lastName} signed in successfully ✅`,
      data: { access_token, refresh_token },
    });
  };

  signUpWithGmail = async (req: Request, res: Response) => {
    const { idToken } = req.body;
    const client = new OAuth2Client();
    const ticket = await client.verifyIdToken({
      idToken,
      audience: AUDIENCE,
    });
    const payload = ticket.getPayload();

    const { name, email, email_verified } = payload as TokenPayload;

    let user = await this._userModel.findOne({ filter: { email: email! } });
    if (!user) {
      user = await this._userModel.create({
        userName: name,
        email,
        confirmed: email_verified,
        provider: ProviderEnum.google,
      } as Partial<IUser>);
    }

    if (user.provider == ProviderEnum.local) {
      throw new AppError("Please, Login with system 🔴", 400);
    }

    const access_token = tokenService.GenerateToken({
      payload: { id: user._id },
      secret_key:
        user.role == RoleEnum.user
          ? ACCESS_SECRET_KEY_USER
          : ACCESS_SECRET_KEY_ADMIN,
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

  forgetPassword = async (req: Request, res: Response) => {
    const { email }: forgetPasswordDto = req.body;
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

    await redisService.setValue({
      key: redisService.otp_key({
        email,
        subject: EmailEnum.forgetPassword,
      }),
      value: Hash({ plain_text: `${otp}` }),
      ttl: 60 * 2,
    });
    await redisService.incr(redisService.max_otp_key(email));

    successResponse({ res });
  };

  logOut = async (req: Request, res: Response) => {
    const { flag } = req.query;
    if (flag == "all") {
      req.user.changeCredential = new Date();
      await req.user.save();
    } else {
      await redisService.setValue({
        key: redisService.revoked_key({
          userId: req.user._id,
          jti: req.decoded.jti!,
        }),
        value: req.decoded.jti!,
        ttl: req.decoded.exp! - Math.floor(Date.now() / 1000),
      });
    }

    res.status(200).json({ message: "Done" });
  };
}

export default new AuthService();
