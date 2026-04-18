import { Model } from "mongoose";
import BaseRepository from "./base.repository";
import userModel, { IUser } from "../models/user.model";

class UserRepository extends BaseRepository<IUser> {
    constructor(protected readonly model: Model<IUser> = userModel){
        super(model)
    }
}

export default UserRepository