import { Request, Response } from "express";
import notificationService from "../../common/service/notification.service";
import S3Service from "../../common/service/S3.service";
import PostRepository from "../../DB/repositories/post.repository";
import UserRepository from "../../DB/repositories/user.repository";
import redisService from "../../common/service/redis.service";
import { HydratedDocument, Types } from "mongoose";
import { AppError } from "../../common/utils/global-error-handler";
import { randomUUID } from "node:crypto";
import { Store_Enum } from "../../common/enum/multer.enum";
import { successResponse } from "../../common/service/response.success";
import { createCommentDTO} from "./comment.dto";
import commentRepository from "../../DB/repositories/comment.repository";
import { postAvailability } from "../../common/utils/post.utils";
import { Allow_Comment_Enum, On_Model_Enum } from "../../common/enum/post.enum";
import { IPost } from "../../DB/models/post.model";
import { IComment } from "../../DB/models/comment.model";

class PostService {
  private readonly _postModel = new PostRepository();
  private readonly _userModel = new UserRepository();
  private readonly _commentModel = new commentRepository();
  private readonly _s3service = new S3Service();
  private readonly _notificationService = notificationService;
  private readonly _redisService = redisService;

  constructor() {}

  createComment = async (req: Request, res: Response) => {
    const { content, tags, onModel }: createCommentDTO = req.body;
    const { postId, commentId } = req.params;

    let doc: HydratedDocument<IPost | IComment> | null = null

    if (onModel === On_Model_Enum.Post && !commentId) {
      doc = await this._postModel.findOne({
        filter: {
          _id: postId,
          $or: [...postAvailability(req)],
          allowComment: Allow_Comment_Enum.allow,
        },
      });

      if (!doc) {
        throw new AppError(
          "Post not found or you are not allowed to comment on it 🔴",
          400,
        );
      }
    } else if (onModel === On_Model_Enum.Comment && commentId) {
      let comment = await this._commentModel.findOne({
        filter: {
          _id: commentId,
          refId: postId!,
        },
        options: {
          populate: [
            {
              path: "refId",
              match: {
                $or: [...postAvailability(req)],
                allowComment: Allow_Comment_Enum.allow,
              },
            },
          ],
        },
      });

      if (!comment?.refId) {
        throw new AppError(
          "Comment not found or you are not allowed to reply on it 🔴",
          400,
        );
      }
      doc = comment
    }

    if(!doc) {
      throw new AppError("Invalid onModel value ❎", 400)
    }

    let mentions: Types.ObjectId[] = [];
    let fcmTokens: string[] = [];
    if (tags?.length) {
      const mentionsTags = await this._userModel.find({
        filter: {
          _id: { $in: tags },
        },
      });
      if (mentionsTags.length !== tags.length) {
        throw new AppError("Invalid tag id ❎");
      }
      for (const tag of mentionsTags) {
        if (tag._id.toString() == req.user._id.toString()) {
          throw new AppError("You can't mention yourself ❎", 400);
        }
        mentions.push(tag._id);
        (await this._redisService.getFCMs(tag._id)).map((token) =>
          fcmTokens.push(token),
        );
      }
    }

    let urls: string[] = [];
    let folderId = randomUUID();

    if (req?.files) {
      urls = (await this._s3service.uploadFiles({
        files: req.files as Express.Multer.File[],
        path: `Users/ ${req?.user?._id}/posts/${doc?.folderId}/comments/${folderId}`,
        store_type: Store_Enum.memory,
      })) as string[];
    }

    const comment = await this._commentModel.create({
      content: content!,
      createdBy: req.user._id,
      tags: mentions,
      attachments: urls,
      folderId,
      refId: doc?._id!,
      onModel
    });

    if (!comment) {
      await this._s3service.deleteFiles(urls);
      throw new AppError("Fail to create comment ❎", 500);
    }
    if (fcmTokens.length) {
      await this._notificationService.sendNotifications({
        tokens: fcmTokens,
        data: {
          title: "You are mentioned in new comment",
          body: comment.content || "New comment",
        },
      });
    }
    successResponse({ res, data: comment });
  };
}

export default new PostService();
