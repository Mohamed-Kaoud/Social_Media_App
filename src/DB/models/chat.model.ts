import mongoose, { Types } from "mongoose";

interface IMessage {
  createdBy: Types.ObjectId;
  content: string;
}

export interface IChat {
  //OVO
  createdBy: Types.ObjectId;
  participants: Types.ObjectId[];
  messages: IMessage[];

  //OVM
  group?: string;
  groupImage?: string;
  roomId?: string;
}

const messageSchema = new mongoose.Schema<IMessage>(
  {
    createdBy: {type: Types.ObjectId, ref: "User", required: true},
    content: {type: String, required: true}
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    strictQuery: true,
  },
);

const chatSchema = new mongoose.Schema<IChat>(
  {
    createdBy: {type: Types.ObjectId, ref: "User", required: true},
    participants: [{type: Types.ObjectId, ref: "User", required: true}],
    messages: [messageSchema],
    group: String,
    groupImage: String,
    roomId: String
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    strictQuery: true,
  },
);

const chatModel = mongoose.models.Chat || mongoose.model<IChat>("Chat", chatSchema)

export default chatModel
