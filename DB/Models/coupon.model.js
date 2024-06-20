import { Schema, model } from "mongoose";

const couponSchema = new Schema(
  {
    code: {
      type: String,
      lowercase: true,
      required: true,
      unique: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
      // max: 100,
      default: 1,
    },
    isPercentage: {
      type: Boolean,
      required: true,
      default: false,
    },
    isFixedAmount: {
      type: Boolean,
      required: true,
      default: false,
    },
    status: {
      type: String,
      enum: ["Valid", "Expired"],
      default: "Valid",
    },
    fromDate: {
      type: String,
      required: true,
    },
    toDate: {
      type: String,
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    deletedAt: {
      type: String,
    },
    couponBased: {
      type: String,
      enum: ["Quantity", "Discount"],
      default: "Discount",
    },
    couponQuantityDetecting: {
      type: Number,
    },
    usageMaxLimitNumber: {
      type: Number,
    },
    usageNumber: {
      type: Number,
      default: 0,
    },

    //   couponAssginedToUsers: [
    //     {
    //       userId: {
    //         type: Schema.Types.ObjectId,
    //         ref: "User",
    //         required: true,
    //       },
    //       maxUsage: {
    //         type: Number,
    //         required: true,
    //       },
    //     },
    //   ],
    //   couponAssginedToProduct: [
    //     {
    //       type: Schema.Types.ObjectId,
    //       ref: "Product",
    //     },
    //   ],
  },
  { timestamps: true }
);

export const couponModel = model("Coupon", couponSchema);
