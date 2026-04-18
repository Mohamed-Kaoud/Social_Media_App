import type { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/global-error-handler";
import { ACCESS_SECRET_KEY, PREFIX } from "../../config/config.service";
import { AccessTokenPayload, VerifyToken } from "../utils/token.service";
import UserRepository from "../../DB/repositories/user.repository";
import { Types } from "mongoose";
import { get, revoked_key } from "../../DB/redis/redis.service";

const user_model = new UserRepository()

export const authentication = async (req: Request,res: Response,next: NextFunction) => {
    const {authorization} = req.headers

    if(!authorization) {
        throw new AppError("Prefix and token are required 🔴", 400)
    }

    const [prefix, token] = authorization.split(" ")

    if(prefix !== PREFIX) {
        throw new AppError("Invalid prefix ❎", 400)
    }

    if(!token) {
        throw new AppError("Token is required 🔴", 400)
    }

    const decoded = VerifyToken<AccessTokenPayload>({token, secret_key: ACCESS_SECRET_KEY})
    if(!decoded || !decoded?.id) {
        throw new AppError("Invalid token ❎", 400)
    }

    const user = await user_model.findById(new Types.ObjectId(decoded.id))
    if(!user) {
        throw new AppError("User not found ❎", 404)
    }

    if(user?.changeCredential?.getTime() > decoded.iat * 1000){
        throw new AppError("Token revoked after logout 🔴", 400)
    }

    const revokedToken = await get(revoked_key({userId: decoded.id, jti: decoded.jti}))
    if(revokedToken) {
        throw new AppError("Token revoked 🔴", 400)
    }

    (req as any).user = user;
    (req as any).decoded = decoded

    next()
    
}