import { Router } from "express";
import { authentication } from "../../common/middleware/authentication";
import { validation } from "../../common/middleware/validation";
import * as CV from "./comment.validation";
import multerCloud from "../../common/middleware/multer.cloud";
import { Store_Enum } from "../../common/enum/multer.enum";
import commentService from "./comment.service";
const commentRouter = Router({mergeParams: true});

commentRouter.post(
  "/",
  authentication,
  multerCloud({ store_type: Store_Enum.memory }).array("attachments"),
  validation(CV.createCommentSchema),
  commentService.createComment,
);




export default commentRouter;
