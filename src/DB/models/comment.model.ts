import mongoose, { Types } from "mongoose";
import { On_Model_Enum } from "../../common/enum/post.enum";

export interface IComment {
  content?: string;
  attachments?: string[];
  createdBy: Types.ObjectId;
  tags?: Types.ObjectId[];
  likes?: Types.ObjectId[];
  folderId: string;
  refId: Types.ObjectId;
  onModel: string
}

const commentSchema = new mongoose.Schema<IComment>(
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
    folderId: String,
    refId: {type: Types.ObjectId, refPath: "onModel", required: true},
    onModel: {type: String, enum: On_Model_Enum, required: true}
  },
  {
    timestamps: true,
    strict: true,
    strictQuery: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

commentSchema.virtual("replies", {
  ref: "Comment",
  localField: "_id",
  foreignField: "refId",
})

const commentModel = mongoose.models.Comment || mongoose.model<IComment>("Comment", commentSchema)

export default commentModel
