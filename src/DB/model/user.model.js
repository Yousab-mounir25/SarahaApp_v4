import mongoose from "mongoose";
import { GenderEnum, ProviderEnum, RoleEnum } from "./../../common/enum/user.enum.js";
const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      minLength: 3,
      maxLength: 20,
    },
    lastName: {
      type: String,
      required: true,
      minLength: 3,
      maxLength: 20,
    },
    email: {
      type: String,
      unique: true,
      required: true,
    },
    password: {
      type: String,
      required: function(){
        return this.provider == ProviderEnum.SYSTEM
      },
    },
    phone: String,
    DOB: Date,
    confirmEmail: Date,
    image: String,
    coverImage: [String],
    gender: {
      type: Number,
      enum: Object.values(GenderEnum),
      default: GenderEnum.MALE,
    },
    role: {
      type: Number,
      enum: Object.values(RoleEnum),
      default: RoleEnum.USER,
    },
    provider: {
      type: Number,
      enum: Object.values(ProviderEnum),
      default: ProviderEnum.SYSTEM,
    },
    changeCredentialsTime:Date
  },
  {
    timestamps: true,
    // collection:lw 3ayez a3'ayar el esm
    strict: false,
    validateBeforeSave: true,
    strictQuery: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    optimisticConcurrency: true,
  },
);

userSchema
  .virtual("username")
  .set(function (value) {
    const [firstName, lastName] = value?.split(" ") || [];
    this.set({ firstName, lastName });
  })
  .get(function () {
    return `${this.firstName} ${this.lastName}`;
  });

export const UserModel = mongoose.model("User", userSchema);
