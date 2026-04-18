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
export const PREFIX: string = process.env.PREFIX || ""
export const AUDIENCE: string = process.env.AUDIENCE || ""