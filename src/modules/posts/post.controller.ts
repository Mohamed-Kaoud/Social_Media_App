import { Router } from "express";
import { authentication } from "../../common/middleware/authentication";
import { validation } from "../../common/middleware/validation";
import * as PV from "./post.validation";
import multerCloud from "../../common/middleware/multer.cloud";
import { Store_Enum } from "../../common/enum/multer.enum";
import postService from "./post.service";
import commentRouter from "../comments/comment.controller";
const postRouter = Router();

postRouter.use("/:postId/comments{/:commentId/replies}", commentRouter)

postRouter.post(
  "/",
  authentication,
  multerCloud({ store_type: Store_Enum.memory }).array("attachments"),
  validation(PV.createPostSchema),
  postService.createPost,
);

postRouter.get("/", authentication, postService.getPosts);

postRouter.put(
  "/update/:postId",
  authentication,
  multerCloud({ store_type: Store_Enum.memory }).array("attachments"),
  validation(PV.updatePostSchema),
  postService.updatePost,
);

postRouter.patch(
  "/:postId",
  authentication,
  validation(PV.likeReactSchema),
  postService.likeReact,
);

export default postRouter;
