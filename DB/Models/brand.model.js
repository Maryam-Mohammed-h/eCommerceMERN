import { Schema, model } from "mongoose";

const brandSchema = new Schema(
  {
    name: {
      type: String,
      lowercase: true,
      unique: true,
      required: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      required: true,
    },
    desc: {
      type: String,
    },
    logo: {
      secure_url: {
        type: String,
        required: true,
      },
      public_id: {
        type: String,
        required: true,
      },
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    customId: String,
  },
  { toObject: { virtuals: true }, toJSON: { virtuals: true }, timestamps: true }
);
brandSchema.virtual("brandProducts", {
  ref: "Product",
  localField: "brandId",
  foreignField: "_id",
});
export const brandModel = model("Brand", brandSchema);
