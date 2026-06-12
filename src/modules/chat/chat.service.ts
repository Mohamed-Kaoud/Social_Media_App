import { Request, Response } from "express";
import UserRepository from "../../DB/repositories/user.repository";
import chatRepository from "../../DB/repositories/chat.repository";
import { AppError } from "../../common/utils/global-error-handler";
import { successResponse } from "../../common/service/response.success";
import { Server, Socket } from "socket.io";
import redisService from "../../common/service/redis.service";
class ChatService {
  private readonly _userModel = new UserRepository();
  private readonly _chatModel = new chatRepository();

  constructor() {}

  //Rest APIs

  getChat = async (req: Request, res: Response) => {
    const { userId } = req.params;

    const chat = await this._chatModel.findOne({
      filter: {
        participants: {
          $all: [req.user?._id, userId],
        },
        group: { $exists: false },
      },
      options: {
        populate: [
          {
            path: "participants",
          },
        ],
      },
    });

    if (!chat) {
      throw new AppError("chat not found", 400);
    }

    successResponse({ res, message: "Done", data: chat });
  };

  // Socket.io

  sayHi = async (data: any) => {
    console.log(data);
  };

  sendMessage = async (data: any, socket: Socket, io: Server) => {
    const { sendTo, content } = data;
    const createdBy = socket.data.user._id;

    const user = await this._userModel.findOne({
      filter: { _id: sendTo },
    });

    if (!user) throw new AppError("user not exist");

    const chat = await this._chatModel.findOneAndUpdate({
      filter: {
        participants: { $all: [sendTo, createdBy] },
        group: { $exists: false },
      },
      update: {
        $push: {
          messages: {
            content,
            createdBy,
          },
        },
      },
    });

    if (!chat) {
      await this._chatModel.create({
        createdBy,
        messages: [
          {
            content,
            createdBy,
          },
        ],
        participants: [sendTo, createdBy],
      });
    }

    io.to(await redisService.getSockets(createdBy)).emit("successMessage", {
      content,
    });

    io.to(await redisService.getSockets(sendTo)).emit("newMessage", {
      content,
      from: socket.data.user,
    });
  };
}

export default new ChatService();
