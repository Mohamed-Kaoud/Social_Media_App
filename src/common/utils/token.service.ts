import jwt, { JwtPayload, SignOptions, VerifyOptions } from "jsonwebtoken"

type GenerateTokenParams = {
    payload: string | Buffer | object,
    secret_key: string,
    options?: SignOptions
}
type VerifyTokenParams = {
    token: string,
    secret_key: string,
    options?: VerifyOptions
}

interface ITokenPayload extends JwtPayload {
  id: string,
  jti: string
}

export const GenerateToken = ({payload , secret_key , options = {}}: GenerateTokenParams): string => {
    return jwt.sign(payload , secret_key , options)
}

export const VerifyToken = ({token , secret_key , options = {}}: VerifyTokenParams): ITokenPayload  => {
    return jwt.verify(token , secret_key , options) as ITokenPayload
}