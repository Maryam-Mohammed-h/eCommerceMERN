import { couponModel } from "../../../DB/Models/coupon.model.js";
import { customAlphabet } from "nanoid";
import moment from "moment";
const nanoid = customAlphabet("123456_=!ascbhdtel", 5);

// ========================================== create Coupon ==========================================
export const createCoupon = async (req, res, next) => {
  const {
    code,
    amount,
    fromDate,
    toDate,
    isPercentage,
    isFixedAmount,
    couponBased,
    couponQuantityDetecting,
    usageMaxLimitNumber,
    usageNumber,
  } = req.body;
  //code
  const couponExist = await couponModel.findOne({ code: code.toLowerCase() });
  if (couponExist) {
    return next(new Error("This coupon is already exist", { cause: 400 }));
  }
  //percentage fixed amount
  if ((!isPercentage && !isFixedAmount) || (isPercentage && isFixedAmount)) {
    return next(
      new Error("The coupon should be percentage OR fixed amount", {
        cause: 400,
      })
    );
  }
  // the following validation is equal to the validation in schema
  // const now = moment().format("YYYY-MM-DD HH:mm");
  // const fromDateMoment = moment(new Date(fromDate)).format("YYYY-MM-DD HH:mm");
  // const toDateMoment = moment(new Date(toDate)).format("YYYY-MM-DD HH:mm");
  // if (
  //   moment(fromDateMoment).isSameOrAfter(moment(toDateMoment)) ||
  //   moment(fromDateMoment).isBefore(moment(now)) ||
  //   moment(toDateMoment).isBefore(moment(now))
  // ) {
  //   return next(
  //     new Error("Please assign proper dates for the coupon ", { cause: 400 })
  //   );
  // }
  // if (amount < 1 || amount >= 100) {
  //   return next(
  //     new Error("Please assign proper coupon amount ", { cause: 400 })
  //   );
  // }
  // const products = await productModel
  //   .find({ price: { $gte: 40000 } })
  //   .select('_id')
  // const couponAssginedToProduct = products
  // ============================== assign to users =====================
  // let usersIds = [];
  // for (const user of couponAssginedToUsers) {
  //   usersIds.push(user.userId);
  // }

  // const usersCheck = await userModel.find({
  //   _id: {
  //     $in: usersIds,
  //   },
  // });

  // if (usersIds.length !== usersCheck.length) {
  //   return next(new Error("invalid userIds", { cause: 400 }));
  // }
  /// ========================================== creating coupon ===========================
  const couponObject = {
    code,
    amount,
    isPercentage,
    isFixedAmount,
    fromDate,
    toDate,
    couponBased,
    couponQuantityDetecting,
    usageMaxLimitNumber,
    createdBy: req.authUser._id,
  };

  const coupon = await couponModel.create(couponObject);
  if (!coupon) {
    return next(
      new Error("try again later , fail to create coupon", { cause: 400 })
    );
  }

  res.status(201).json({ message: "Added Done", coupon });
};

// ========================================== updae product ==========================================
export const updateCoupon = async (req, res, next) => {
  const { couponId } = req.params;
  const { code, amount, status, fromDate, toDate } = req.body;

  const couponExist = await couponModel.findOne({
    _id: couponId,
    createdBy: req.authUser._id,
  });
  if (!couponExist) {
    return next(new Error("This coupon is not exist", { cause: 400 }));
  }
  if (code) {
    const coupon = await couponModel.find({ code: code.toLowerCase() });
    if (couponExist) {
      return next(new Error("This coupon is already exist", { cause: 400 }));
    }
    couponExist.code = code;
  }
  if (status) {
    if (status == "valid" || status == "invalid") {
      couponExist.status = status;
    }
    status == "valid" || status == "invalid"
      ? (couponExist.status = status)
      : couponExist.status;
  }
  if (amount) {
    if (amount < 0 || amount >= 100) {
      return next(
        new Error("Please assign proper coupon amount ", { cause: 400 })
      );
    }
    couponExist.amount = amount;
  }
  if (fromDate || toDate) {
    const now = moment().format("YYYY-MM-DD HH:mm");
    const fromDateMoment = moment(new Date(fromDate)).format(
      "YYYY-MM-DD HH:mm"
    );
    const toDateMoment = moment(new Date(toDate)).format("YYYY-MM-DD HH:mm");

    if (
      moment(fromDateMoment).isSameOrAfter(moment(toDateMoment)) ||
      moment(fromDateMoment).isBefore(moment(now)) ||
      moment(toDateMoment).isBefore(moment(now))
    ) {
      return next(
        new Error("Please assign proper dates for the coupon ", { cause: 400 })
      );
    }
    couponExist.fromDate = fromDateMoment;
    couponExist.toDate = toDateMoment;
  }

  await couponExist.save();
  res.status(200).json({ message: "Updated Done", couponExist });
};

// ================================= Delete Product  =================================
export const deleteCoupon = async (req, res, next) => {
  const { couponId } = req.params;
  const now = moment().format("YYYY-MM-DD HH:mm");
  // get product by id
  const coupon = await couponModel.findOneAndUpdate(
    { _id: couponId, status: "Valid", createdBy: req.authUser._id },
    { deletedAt: now, status: "Expired" },
    { new: true }
  );

  if (!coupon) {
    return next(new Error("Invalid coupon data", { cause: 400 }));
  }
  res.status(200).json({ message: "Deleted Done", coupon });
};
