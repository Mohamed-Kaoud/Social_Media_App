import * as z from "zod";
import {
  GenderEnum,
  ProviderEnum,
  RoleEnum,
} from "../../common/enum/user.enum";

export const signUpSchema = {
  body: z
    .object({
      firstName: z.string().min(2),
      lastName: z.string().min(2),
      email: z.string().email(),
      password: z.string().min(4),
      cPassword: z.string().min(4),
      age: z.number().min(18).max(60),
      phone: z.string().length(11).optional(),
      address: z.string().optional(),
      gender: z.enum(GenderEnum).optional(),
      provider: z.enum(ProviderEnum).optional(),
      role: z.enum(RoleEnum).optional(),
    })
    .refine(
      (data) => {
        return data.password === data.cPassword;
      },
      {
        error: "Confirmed password must match the password 🔴",
        path: ["cPassword"],
      },
    ),
};

export const resendOtpSchema = {
  body: z.object({
    email: z.string().email(),
  }),
};

export const signInSchema = {
  body: z.object({
    email: z.string().email(),
    password: z.string().min(4),
  }),
};

export const confirmEmailSchema = {
  body: z.object({
    email: z.string().email(),
    code: z.string().regex(/^\d{6}$/),
  }),
};

export const resetPasswordSchema = {
  body: z
    .object({
      email: z.string().email(),
      code: z.string().regex(/^\d{6}$/),
      password: z.string().min(4),
      cPassword: z.string().min(4),
    })
    .refine(
      (data) => {
        return data.password == data.cPassword;
      },
      {
        error: "Confirmed password must match the password 🔴",
        path: ["cPassword"],
      },
    ),
};

export const forgetPasswordSchema = {
  body: z.object({
    email: z.string().email(),
  }),
};

export type signUpDto = z.infer<typeof signUpSchema.body>;
export type signInDto = z.infer<typeof signInSchema.body>;
export type confirmEmailDto = z.infer<typeof confirmEmailSchema.body>;
export type forgetPasswordDto = z.infer<typeof forgetPasswordSchema.body>;
export type resendOtpDto = z.infer<typeof resendOtpSchema.body>;
export type resetPasswordDto = z.infer<typeof resetPasswordSchema.body>
