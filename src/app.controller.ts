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
import notificationService from "./common/service/notification.service";
import postRouter from "./modules/posts/post.controller";

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

  app.post("/send-notification", (req: Request, res: Response) => {

    notificationService.sendNotification({
      token: req.body.token,
      data: {
        title: "Hiii",
        body: "Hiii Tany"
      }
    })
    console.log({token: req.body.token});
    
  });

  app.use("/auth", authRouter);
  app.use("/users", userRouter);
  app.use("/posts", postRouter)

  app.use("{/*notFound}", (req: Request, res: Response) => {
    throw new AppError(`URL ${req.originalUrl} not found ❎ `, 404);
  });

  app.use(globalErrorHandler);

  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
};

export default bootstrap;
