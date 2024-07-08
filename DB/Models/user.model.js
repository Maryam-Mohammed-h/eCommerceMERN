import { Schema, model } from "mongoose";
import pkg from "bcrypt";
import { systemRoles } from "../../src/utils/systemRoles.js";
const userSchema = new Schema(
  {
    userName: {
      type: String,
      required: [true, "User name is required"],
      minLength: [3, "User name should be more than 3 letters"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: [true, "This email is already in use"],
      lowerCase: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    address: [
      {
        type: String,
        required: true,
      },
    ],
    profilePicture: {
      secure_url: String,
      public_id: String,
    },
    isConfirmed: {
      type: Boolean,
      required: true,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      default: systemRoles.USER,
      enum: [systemRoles.ADMIN, systemRoles.USER, systemRoles.SUPER_ADMIN],
    },
    status: {
      type: String,
      default: "Offline",
      enum: ["Offline", "Online"],
    },
    gender: {
      type: String,
      default: "NotSpecified",
      enum: ["Male", "Female", "NotSpecified"],
    },
    age: Number,
    token: String,
    forgetCode: String,
    changePasswordAt: { type: Date },
  },
  { timestamps: true }
);
userSchema.pre("save", function (next, hash) {
  this.password = pkg.hashSync(this.password, +process.env.SALT_ROUNDS);
  next();
});
export const userModel = model("User", userSchema);
