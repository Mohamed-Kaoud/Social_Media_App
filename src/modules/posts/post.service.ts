import { Request, Response } from "express";
import notificationService from "../../common/service/notification.service";
import S3Service from "../../common/service/S3.service";
import PostRepository from "../../DB/repositories/post.repository";
import UserRepository from "../../DB/repositories/user.repository";
import redisService from "../../common/service/redis.service";
import { createPostDto, updatePostDto } from "./post.dto";
import { Types } from "mongoose";
import { AppError } from "../../common/utils/global-error-handler";
import { randomUUID } from "node:crypto";
import { Store_Enum } from "../../common/enum/multer.enum";
import { successResponse } from "../../common/service/response.success";
import { Availability_Enum } from "../../common/enum/post.enum";
import { postAvailability } from "../../common/utils/post.utils";

class PostService {
  private readonly _postModel = new PostRepository();
  private readonly _userModel = new UserRepository();
  private readonly _s3service = new S3Service();
  private readonly _notificationService = notificationService;
  private readonly _redisService = redisService;

  constructor() {}

  createPost = async (req: Request, res: Response) => {
    const { content, allowComment, availability, tags }: createPostDto =
      req.body;
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
        path: `Users/ ${req?.user?._id}/posts/${folderId}`,
        store_type: Store_Enum.memory,
      })) as string[];
    }

    const post = await this._postModel.create({
      content: content!,
      createdBy: req.user._id,
      allowComment,
      availability,
      tags: mentions,
      attachments: urls,
      folderId,
    });

    if (!post) {
      await this._s3service.deleteFiles(urls);
      throw new AppError("Fail to create post ❎", 400);
    }
    if (fcmTokens.length) {
      await this._notificationService.sendNotifications({
        tokens: fcmTokens,
        data: {
          title: "You are mentioned in new post",
          body: content || "New Post",
        },
      });
    }
    successResponse({ res, data: post });
  };

  getPosts = async (req: Request, res: Response) => {

    // const posts = await this._postModel.paginate({
    //   page: +req?.query?.page!,
    //   limit: +req?.query?.limit!,
    //   search: {
    //     ...(req.query.search ? {
    //       $or: [
    //         {content: {$regex: req.query.search, $options: "i"}}
    //       ]
    //     } : {})
    //   }
    // })

    const posts = await this._postModel.find({
      filter: {
        $or: [
         ...postAvailability(req)
        ],
      },
      options: {
        populate: [
          {
            path: "comments",
            match: {
              commentId: {$exists: false}
            },
            populate: [
              {
                path: "replies"
              }
            ]
          }
        ]
      }
    });

    successResponse({ res, data: posts });
  };

  likeReact = async (req: Request, res: Response) => {
    const { postId } = req.params;
    const { flag } = req.query;

    let updatedQuery: any = {
      $addToSet: { likes: req.user._id },
    };
    if (flag === "disLike") {
      updatedQuery = {
        $pull: { likes: req.user._id },
      };
    }

    const post = await this._postModel.findOneAndUpdate({
      filter: {
        _id: postId,
        $or: [
          { availability: Availability_Enum.public },
          { availability: Availability_Enum.only_me, createdBy: req.user._id },
          {
            availability: Availability_Enum.friends,
            createdBy: { $in: [...(req.user.friends || []), req.user._id] },
          },
          { tags: { $in: [req.user._id] } },
        ],
      },
      update: updatedQuery,
    });

    if (!post) {
      throw new AppError("Post not found ❎", 404);
    }

    successResponse({ res, data: post });
  };

  updatePost = async (req: Request, res: Response) => {
    const { postId } = req.params;
    const {
      content,
      allowComment,
      availability,
      tags,
      removeTags,
      removeFiles,
    }: updatePostDto = req.body;

    const post = await this._postModel.findOne({
      filter: {
        _id: postId,
        createdBy: req.user._id,
      },
    });

    if (!post) {
      throw new AppError("Post not found or unauthorized access 🔴", 400);
    }

    if (removeFiles?.length) {
      const invalidFiles = removeFiles.filter((file: string) => {
        return !post.attachments?.includes(file);
      });

      if (invalidFiles.length) {
        throw new AppError(
          "Some of files you want to remove not exist ❎",
          404,
        );
      }
      await this._s3service.deleteFiles(removeFiles);

      post.attachments = post.attachments?.filter((file: string) => {
        return !removeFiles.includes(file);
      }) as string[];
    }

    const dbTags = new Set(post.tags?.map((id) => id.toString()));

    removeTags?.forEach((tag: string) => {
      return dbTags.delete(tag);
    });

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
        dbTags.add(tag._id.toString());
        (await this._redisService.getFCMs(tag._id)).map((token) =>
          fcmTokens.push(token),
        );
      }
    }

    post.tags = [...dbTags].map((id: string) => new Types.ObjectId(id));

    if (req?.files) {
      let urls = (await this._s3service.uploadFiles({
        files: req.files as Express.Multer.File[],
        path: `Users/ ${req?.user?._id}/posts/${post.folderId}`,
        store_type: Store_Enum.memory,
      })) as string[];
      post.attachments?.push(...urls);
    }

    if (fcmTokens.length) {
      await this._notificationService.sendNotifications({
        tokens: fcmTokens,
        data: {
          title: "You are mentioned in new post",
          body: content || "New Post",
        },
      });
    }

    if(content) post.content = content
    if(allowComment) post.allowComment = allowComment
    if(availability) post.availability = availability

    await post.save()

    successResponse({res, data: post})



  };
}

export default new PostService();
