import express from "express";
import type { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { PORT } from "./config/config.service";
import {
  AppError,
  globalErrorHandler,
} from "./common/utils/global-error-handler";
import checkConnectionDB from "./DB/connectionDB";
import authRouter from "./modules/auth/auth.controller";
import userRouter from "./modules/users/user.controller";
import redisService from "./common/service/redis.service";
import S3Service from "./common/service/S3.service";
import { pipeline } from "node:stream/promises";
import { successResponse } from "./common/service/response.success";
const app: express.Application = express();
const port: number = PORT;

const bootstrap = () => {
  const limiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 20,
    legacyHeaders: false,
    handler: (req: Request, res: Response, next: NextFunction) => {
      throw new AppError("Too many requests 🔴, Try again later", 429);
    },
  });

  app.use(express.json());
  app.use(cors(), helmet(), limiter);

  checkConnectionDB();
  redisService.connect()

  app.get("/", (req: Request, res: Response) => {
    res.status(200).json({ message: "Welcome on Social Media App 😍🤩" });
  });

  app.get("/upload", async (req: Request, res: Response, next: NextFunction) => {

    const { folderName } = req.query as { folderName: string }
    console.log({ folderName });

    let result = await new S3Service().getFiles(folderName)
    let resultMapped = result.Contents?.map((file) => ({
        Key: file.Key
    }))

    successResponse({ res, data: resultMapped })

})

  app.get("/upload/pre-signed/*path", async (req: Request, res: Response, next: NextFunction) => {

    const { path } = req.params as { path: string[] }
    const { download } = req.query as { download: string }
    const Key = path.join("/") as string

    console.log({ download })

    const url = await new S3Service().getPreSignedUrl({
        Key,
        download: download ? download : undefined
    })

    successResponse({ res, data: url })
})

  app.get("/upload/*path", async (req: Request, res: Response, next: NextFunction) => {

    const { path } = req.params as { path: string[] }
    const {download} = req.query
    const Key = path.join("/") as string

    const result = await new S3Service().getFile(Key)
    const stream = result.Body as NodeJS.ReadableStream
    res.setHeader("Content-Type", result.ContentType!)
    res.set("Cross-Origin-Resource-Policy", "cross-origin");
    if(download && download === "true") {
    res.setHeader("Content-Disposition", `attachment; filename="${path.pop()}"`);
    }
    await pipeline(stream, res)
    
})

  app.use("/auth", authRouter);
  app.use("/users", userRouter);

  app.use("{/*notFound}", (req: Request, res: Response) => {
    throw new AppError(`URL ${req.originalUrl} not found ❎ `, 404);
  });

  app.use(globalErrorHandler);

  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
};

export default bootstrap;
