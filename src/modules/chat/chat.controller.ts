import { Router } from "express";
import chatService from "./chat.service";
import { authentication } from "../../common/middleware/authentication";
import multerCloud from "../../common/middleware/multer.cloud";

const chatRouter = Router({mergeParams: true})

chatRouter.get("/", authentication ,chatService.getChat)

chatRouter.get("/group/:groupId", authentication, chatService.getGroupChat)

chatRouter.post("/", authentication, multerCloud().single("attachments"), chatService.createGroupChat)

export default chatRouter