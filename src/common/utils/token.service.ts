import jwt, { SignOptions, VerifyOptions } from "jsonwebtoken";

export type AccessTokenPayload = {
  jti: any;
  iat: number;
  id: string;
};

export const GenerateToken = <T extends object>({
  payload,
  secret_key,
  options,
}: {
  payload: T;
  secret_key: string;
  options?: SignOptions;
}) => {
  return jwt.sign(payload, secret_key, options);
};

export const VerifyToken = <T extends object>({
  token,
  secret_key,
  options,
}: {
  token: string;
  secret_key: string;
  options?: VerifyOptions;
}): T | null => {
  try {
    return jwt.verify(token, secret_key, options) as T;
  } catch {
    return null;
  }
};
