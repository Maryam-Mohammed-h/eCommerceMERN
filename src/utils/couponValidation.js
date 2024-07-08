import { couponModel } from "../../DB/Models/coupon.model.js";
import moment from "moment-timezone";

export const isCouponValid = async ({ couponCode, subTotal, next } = {}) => {
  //exist
  const couponExist = await couponModel.findOne({ code: couponCode });
  if (!couponExist) {
    return next(new Error("There is no coupon with that code", { cause: 400 }));
  }
  //start date

  if (
    couponExist.status == "Valid" &&
    moment()
      .tz("Africa/Cairo")
      .isBefore(moment(new Date(couponExist.fromDate)).tz("Africa/Cairo"))
  ) {
    console.log(
      moment(new Date(couponExist.fromDate)).tz("Africa/Cairo"),
      moment().tz("Africa/Cairo")
    );
    return next(new Error("This coupon does not start yet", { cause: 400 }));
  }
  //expiration
  if (
    couponExist.status == "Expired" ||
    moment(couponExist.toDate)
      .tz("Africa/Cairo")
      .isBefore(moment().tz("Africa/Cairo"))
  ) {
    console.log(
      moment(couponExist.toDate).tz("Africa/Cairo"),
      moment().tz("Africa/Cairo")
    );
    return next(new Error("This coupon is expired", { cause: 400 }));
  }

  //coupon based
  if (
    couponExist.couponBased == "Quantity" &&
    subTotal < couponExist.couponQuantityDetecting
  ) {
    return next(
      new Error(
        `This coupon is working on ${couponExist.couponQuantityDetecting}$ or higher `,
        { cause: 400 }
      )
    );
  }
  // usage max limit number
  if (couponExist.usageMaxLimitNumber) {
    if (couponExist.usageMaxLimitNumber <= couponExist.usageNumber) {
      return next(
        new Error(`This coupon is not valid anymore`, { cause: 400 })
      );
    }
  }

  return true;
};
