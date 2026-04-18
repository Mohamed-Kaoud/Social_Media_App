import mongoose from "mongoose";
import {
  GenderEnum,
  ProviderEnum,
  RoleEnum,
} from "../../common/enum/user.enum";

export interface IUser {
  firstName: string;
  lastName: string;
  userName: string;
  email: string;
  password: string;
  address?: string;
  phone?: string;
  age: number;
  confirmed: boolean;
  changeCredential: Date;
  gender?: GenderEnum;
  role?: RoleEnum;
  provider?: ProviderEnum;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new mongoose.Schema<IUser>(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
      min: 2,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      min: 2,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    password: {
      type: String,
      required: function (this: any) {
        return this.provider === ProviderEnum.local;
      },
      trim: true,
      min: 4,
    },
    age: {
      type: Number,
      required: function (this: any) {
        return this.provider === ProviderEnum.local;
      },
    },
    phone: String,
    address: String,
    confirmed: Boolean,
    changeCredential: Date,
    gender: {
      type: String,
      enum: GenderEnum,
      default: GenderEnum.male,
    },
    role: {
      type: String,
      enum: RoleEnum,
      default: RoleEnum.user,
    },
    provider: {
      type: String,
      enum: ProviderEnum,
      default: ProviderEnum.local,
    },
  },
  {
    timestamps: true,
    strict: true,
    strictQuery: true,
  },
);

userSchema
  .virtual("userName")
  .get(function () {
    return this.firstName + " " + this.lastName;
  })
  .set(function (v: string) {
    const [firstName, lastName] = v.split(" ") || [];
    this.set({ firstName, lastName });
  });

const userModel =
  mongoose.models.User || mongoose.model<IUser>("User", userSchema);

export default userModel;
