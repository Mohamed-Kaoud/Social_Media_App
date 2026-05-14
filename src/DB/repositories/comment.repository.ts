import { Model } from "mongoose";
import BaseRepository from "./base.repository";
import commentModel from "../models/comment.model";
import { IComment } from "../models/comment.model";


class commentRepository extends BaseRepository<IComment> {
    constructor(protected readonly model: Model<IComment> = commentModel){
        super(model)
    }
}

export default commentRepository