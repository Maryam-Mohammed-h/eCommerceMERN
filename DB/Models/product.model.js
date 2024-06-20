import { Schema, model } from "mongoose";

const productSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    desc: {
      type: String,
    },
    slug: {
      type: String,
      lowercase: true,
      required: true,
    },
    colors: [String],
    sizes: [String],
    price: {
      type: Number,
      required: true,
      default: 1,
    },
    appliedDiscount: {
      type: Number,
      default: 0,
    },
    priceAfterDiscount: {
      type: Number,
      default: 0,
    },
    stock: {
      type: Number,
      required: true,
      default: 1,
    },
    soldItems: {
      type: Number,
      default: 0,
    },
    Images: [
      {
        secure_url: {
          type: String,
          required: true,
        },
        public_id: {
          type: String,
          required: true,
        },
      },
    ],
    public_ids: [String],
    folderPath: String,
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    brandId: {
      type: Schema.Types.ObjectId,
      ref: "Brand",
      required: true,
    },
    subCategoryId: {
      type: Schema.Types.ObjectId,
      ref: "subCategory",
      required: true,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    customId: String,
  },
  {
    timestamps: true,
  }
);

export const productModel = model("Product", productSchema);
