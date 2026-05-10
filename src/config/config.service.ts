import {resolve} from "node:path"
import { config } from "dotenv";

const NODE_ENV = process.env.NODE_ENV

config({path: resolve(__dirname,`../../.env.${NODE_ENV}`)})

export const PORT: number = Number(process.env.PORT)
export const DB_URI: string = process.env.DB_URI || ""
export const SALT_ROUNDS: number = Number(process.env.SALT_ROUNDS)
export const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY
export const EMAIL = process.env.EMAIL
export const PASSWORD = process.env.PASSWORD
export const ACCESS_SECRET_KEY: string = process.env.ACCESS_SECRET_KEY || ""
export const REDIS_URL: string = process.env.REDIS_URL || ""
export const USER_PREFIX: string = process.env.USER_PREFIX || ""
export const ADMIN_PREFIX: string = process.env.ADMIN_PREFIX || ""
export const AUDIENCE: string = process.env.AUDIENCE || ""
export const ACCESS_SECRET_KEY_USER: string = process.env.ACCESS_SECRET_KEY_USER || ""
export const ACCESS_SECRET_KEY_ADMIN: string = process.env.ACCESS_SECRET_KEY_ADMIN || ""
export const REFRESH_SECRET_KEY_USER: string = process.env.REFRESH_SECRET_KEY_USER || ""
export const REFRESH_SECRET_KEY_ADMIN: string = process.env.REFRESH_SECRET_KEY_ADMIN || ""
export const DB_URI_ONLINE: string = process.env.DB_URI_ONLINE || ""
export const AWS_REGION: string = process.env.AWS_REGION || ""
export const AWS_BUCKET_NAME: string = process.env.AWS_BUCKET_NAME || ""
export const AWS_ACCESS_KEY: string= process.env.AWS_ACCESS_KEY || ""
export const AWS_SECRET_ACCESS_KEY: string= process.env.AWS_SECRET_ACCESS_KEY || ""