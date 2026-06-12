import { Request, Response } from "express";
import UserRepository from "../../DB/repositories/user.repository";
import chatRepository from "../../DB/repositories/chat.repository";
import { AppError } from "../../common/utils/global-error-handler";
import { successResponse } from "../../common/service/response.success";
import { Server, Socket } from "socket.io";
import redisService from "../../common/service/redis.service";
import { Types } from "mongoose";
import { uuidv4 } from "zod";
import S3Service from "../../common/service/S3.service";
class ChatService {
  private readonly _userModel = new UserRepository();
  private readonly _chatModel = new chatRepository();
  private readonly _s3service = new S3Service();

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

  createGroupChat = async (req: Request, res: Response) => {
    let { group, groupImage, participants } = req.body;
    const createdBy = req.user?._id as Types.ObjectId;

    const dbParticipants = participants.map((participant: string) =>
      Types.ObjectId.createFromHexString(participant),
    );

    const users = await this._userModel.find({
      filter: {
        _id: {
          $in: dbParticipants,
        },
        friends: {
          $in: [createdBy],
        },
      },
    });

    if (users.length !== participants.length) {
      throw new AppError("some users not found", 404);
    }

    const roomId = group?.replaceAll(/\s+/g, "-") + "-" + uuidv4();

    if (req.file) {
      groupImage = await this._s3service.uploadFile({
        path: `chat/${roomId}`,
        file: req.file as Express.Multer.File,
      });
    }

    dbParticipants.push(createdBy);

    const chat = await this._chatModel.create({
      group,
      groupImage,
      roomId,
      createdBy,
      messages: [],
      participants: dbParticipants,
    });
    if (!chat) {
      if (groupImage) {
        await this._s3service.deleteFile(groupImage);
      }
      throw new AppError("Chat not created ❎", 400);
    }

    successResponse({ res, data: { chat } });
  };

  getGroupChat = async (req: Request, res: Response) => {
    const { groupId } = req.params;

    let { page, limit = 5 } = req.query as unknown as {
      page: number;
      limit: number;
    };

    if (page < 0 || !page) page = 1;

    page = page * 1 || 1;
    limit = limit * 1 || 5;

    const chat = await this._chatModel.findOne({
      filter: {
        _id: groupId,
        participants: {
          $in: [req.user?._id],
        },
        group: { $exists: true },
      },
      options: {
        populate: [
          {
            path: "messages.createdBy",
          },
        ],
      },
    });

    if (!chat) {
      throw new AppError("Chat not found", 404);
    }

    successResponse({ res, data: { chat } });
  };

  // Socket.io

  sayHi = async (data: any, socket: Socket, io: Server) => {
    console.log(data);
    socket.emit("sayHiBack", { message: "Hello too" });
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

  sendGroupMessage = async (data: any, socket: Socket, io: Server) => {
    const { content, groupId } = data;
    const createdBy = socket.data.user._id;

    const chat = await this._chatModel.findOneAndUpdate({
      filter: {
        _id: groupId,
        participants: {
          $all: [createdBy],
        },
        group: { $exists: true },
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
      throw new AppError("chat not found", 404);
    }

    io.to(await redisService.getSockets(createdBy)).emit("successMessage", {
      content,
    });

    io.to(chat.roomId!).emit("newMessage", {
      content,
      from: socket.data.user,
      groupId,
    });
  };

  join_room = async (data: any, socket: Socket, io: Server) => {
    const { roomId } = data;
    const chat = await this._chatModel.findOne({
      filter: {
        roomId,
        participants: {
          $in: [socket.data.user._id],
        },
        group: {
          $exists: true,
        },
      },
    });
    if (!chat) {
      throw new AppError("Chat not found", 404);
    }
    socket.join(chat.roomId!);
  };
}

export default new ChatService();
