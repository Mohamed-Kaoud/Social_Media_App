import mongoose, { Types } from "mongoose";
import {
  Allow_Comment_Enum,
  Availability_Enum,
} from "../../common/enum/post.enum";

export interface IPost {
  content?: string;
  attachments?: string[];
  createdBy: Types.ObjectId;
  tags?: Types.ObjectId[];
  likes?: Types.ObjectId[];
  allowComment?: Allow_Comment_Enum;
  availability?: Availability_Enum;
  folderId: string;
}

const postSchema = new mongoose.Schema<IPost>(
  {
    content: {
      type: String,
      min: 1,
      required: function (this) {
        return !this.attachments?.length;
      },
    },
    attachments: [String],
    createdBy: {
      type: Types.ObjectId,
      required: true,
      ref: "User",
    },
    tags: [{ type: Types.ObjectId, ref: "User" }],
    likes: [{ type: Types.ObjectId, ref: "User" }],
    allowComment: {
      type: String,
      enum: Allow_Comment_Enum,
      default: Allow_Comment_Enum.allow,
    },
    availability: {
      type: String,
      enum: Availability_Enum,
      default: Availability_Enum.friends,
    },
    folderId: String,
  },
  {
    timestamps: true,
    strict: true,
    strictQuery: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

const postModel = mongoose.models.Post || mongoose.model<IPost>("Post", postSchema)

export default postModel
