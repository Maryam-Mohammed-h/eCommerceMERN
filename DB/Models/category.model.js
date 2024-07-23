import { Schema, model } from "mongoose";

const categorySchema = new Schema(
  {
    name: {
      type: String,
      unique: true,
      lowercase: true,
      required: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      required: true,
    },
    Image: {
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
categorySchema.virtual("subCategories", {
  ref: "subCategory",
  // localField: "categoryId",
  // foreignField: "_id",
  localField: "_id",
  foreignField: "categoryId",
});
export const categoryModel = model("Category", categorySchema);
