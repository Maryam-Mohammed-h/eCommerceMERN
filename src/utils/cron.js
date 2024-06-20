import { scheduleJob } from "node-schedule";
import { couponModel } from "../../DB/Models/coupon.model.js";
import moment from "moment-timezone";
export const changeCouponStatusCron = () => {
  scheduleJob("* */60 * * * *", async function () {
    const validCoupons = await couponModel.find({ status: "Valid" });
    for (const coupon of validCoupons) {
      if (
        moment(coupon.toDate)
          .tz("Africa/Cairo")
          .isBefore(moment().tz("Africa/Cairo"))
      ) {
        coupon.status = "Expired";
      }
      await coupon.save();
    }
    console.log("cron changeCouponStatusCron is running ...");
  });
};
