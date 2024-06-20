import { couponModel } from "../../../DB/Models/coupon.model.js";
import { orderModel } from "../../../DB/Models/order.model.js";
import { productModel } from "../../../DB/Models/product.model.js";
import { isCouponValid } from "../../utils/couponValidation.js";
import { cartModel } from "../../../DB/Models/cart.model.js";
import { customAlphabet } from "nanoid";
import createInvoice from "../../utils/pdfkit.js";
import sendEmailService from "../../services/email/sendEmailService.js";
const nanoid = customAlphabet("123456_=!ascbhdtel", 5);
// ===================== create order ===================
export const createOrder = async (req, res, next) => {
  const userId = req.authUser._id;
  const {
    productId,
    quantity,
    address,
    phoneNumber,
    paymentMethod,
    couponCode,
  } = req.body;

  // ================  product============
  const products = [];
  const isProductValid = await productModel.findOne({
    _id: productId,
    stock: { $gte: quantity },
  });
  if (!isProductValid) {
    return next(
      new Error(`Invalid product , please check the  quantity `, { cause: 400 })
    );
  }
  const productObj = {
    productId,
    quantity,
    title: isProductValid.title,
    price: isProductValid.priceAfterDiscount,
    finalPrice: isProductValid.priceAfterDiscount * quantity,
  };
  products.push(productObj);
  // ===========calculate total price + calculate price with coupon ======
  const subTotal = productObj.finalPrice;
  // =====================  check Coupon code =================

  if (couponCode) {
    const couponExist = await couponModel.findOne({ code: couponCode });
    const isCouponValidResult = await isCouponValid({
      couponCode,
      subTotal,
      next,
    });
    if (isCouponValidResult !== true) {
      return isCouponValidResult;
    }
    req.coupon = couponExist;
  }
  let paidAmount = 0;
  if (req.coupon?.isPercentage) {
    paidAmount = subTotal * (1 - (req.coupon?.amount || 0) / 100);
  } else if (req.coupon?.isFixedAmount) {
    paidAmount = subTotal - req.coupon?.amount;
    if (paidAmount < 0) {
      paidAmount = 0;
    }
  } else {
    paidAmount = subTotal;
  }

  //   =======================
  let orderStatus;
  paymentMethod == "Cash"
    ? (orderStatus = "Placed")
    : (orderStatus = "Pending");

  // =======================
  const orderObj = {
    userId,
    products,
    subTotal,
    paidAmount,
    address,
    phoneNumber,
    paymentMethod,
    orderStatus,
    couponId: req.coupon?._id,
  };
  const orderDB = await orderModel.create(orderObj);
  if (!orderDB) {
    return next(
      new Error(`Failed to make new order, please try again later`, {
        cause: 400,
      })
    );
  } else {
    //decrease product stock  by quantity
    await productModel.findOneAndUpdate(
      {
        _id: productId,
      },
      { $inc: { stock: -parseInt(quantity), soldItems: parseInt(quantity) } }
    );
    //remove product from user cart if exist
    ///

    // change coupon usage amount if exist
    if (couponCode) {
      if (req.coupon.usageMaxLimitNumber) {
        await couponModel.findOneAndUpdate(
          { code: couponCode },
          { $inc: { usageNumber: 1 } }
        );
        if (req.coupon.usageNumber == req.coupon.usageMaxLimitNumber - 1) {
          await couponModel.findOneAndUpdate(
            { code: couponCode },
            { status: "Expired" }
          );
        }
      }
    }
    // ==================== invoice ==================
    const orderCode = `${req.authUser.userName}_${nanoid(3)}`;
    const orderInvoice = {
      orderCode,
      date: orderDB.createdAt,
      items: orderDB.products,
      subTotal: orderDB.subTotal,
      paidAmount: orderDB.paidAmount,
      shipping: {
        name: req.authUser.userName,
        address: orderDB.address,
        city: "Cairo",
        state: "Cairo",
        country: "Egypt",
      },
    };
    await createInvoice(orderInvoice, `${orderCode}.pdf`);
    await sendEmailService({
      to: req.authUser.email,
      subject: "Order confirmation",
      message: "<h1> You can find your order info in the pdf below</h1>",
      attachments: [
        {
          path: `./Files/${orderCode}.pdf`,
        },
      ],
    });
    return res.status(201).json({ message: "add order done ", orderDB });
  }
};
// ################################################################
export const fromCartToOrder = async (req, res, next) => {
  const userId = req.authUser._id;
  const { cartId } = req.query;
  const { address, phoneNumber, paymentMethod, couponCode } = req.body;
  const cart = await cartModel.findById({ _id: cartId, userId });
  if (!cart || !cart.products.length) {
    return next(
      new Error(`Cart has no items yet`, {
        cause: 400,
      })
    );
  }
  // =====================  check Coupon code =================

  //subTotal
  let subTotal = cart.subTotal;
  let paidAmount = 0;

  if (couponCode) {
    const couponExist = await couponModel.findOne({ code: couponCode });
    const isCouponValidResult = await isCouponValid({
      couponCode,
      subTotal,
      next,
    });
    if (isCouponValidResult !== true) {
      return isCouponValidResult;
    }
    req.coupon = couponExist;
  }

  if (req.coupon?.isPercentage) {
    paidAmount = subTotal * (1 - (req.coupon.amount || 0) / 100);
  } else if (req.coupon.isFixedAmount) {
    paidAmount = subTotal - req.coupon.amount;
    if (paidAmount < 0) {
      paidAmount = 0;
    }
  } else {
    paidAmount = subTotal;
  }
  //   =======================
  let orderStatus;
  paymentMethod == "Cash"
    ? (orderStatus = "Placed")
    : (orderStatus = "Pending");
  // =====================
  let orderProducts = [];
  for (const prod of cart.products) {
    const productExist = await productModel.findById(prod.productId);
    orderProducts.push({
      productId: prod.productId,
      quantity: prod.quantity,
      title: productExist.title,
      price: productExist.priceAfterDiscount,
      finalPrice: productExist.priceAfterDiscount * prod.quantity,
    });
  }
  // =======================
  const orderObj = {
    userId,
    products: orderProducts,
    subTotal,
    paidAmount,
    address,
    phoneNumber,
    paymentMethod,
    orderStatus,
    couponId: req.coupon?._id,
  };
  const orderDB = await orderModel.create(orderObj);
  if (orderDB) {
    //decrease product stock  by quantity
    for (const prod of cart.products) {
      await productModel.findOneAndUpdate(
        {
          _id: prod.productId,
        },
        { $inc: { stock: -parseInt(prod.quantity) } }
      );
    }
    // change coupon usage amount if exist
    if (couponCode) {
      if (req.coupon.usageMaxLimitNumber) {
        await couponModel.findOneAndUpdate(
          { code: couponCode },
          { $inc: { usageNumber: 1 } }
        );
        if (req.coupon.usageNumber == req.coupon.usageMaxLimitNumber - 1) {
          await couponModel.findOneAndUpdate(
            { code: couponCode },
            { status: "Expired" }
          );
        }
      }
    }
    //remove product from user cart if exist
    cart.products = [];
    await cart.save();
    return res.status(201).json({ message: "add order done ", orderDB, cart });
  }
  return next(
    new Error(`Failed to make new order, please try again later`, {
      cause: 400,
    })
  );
};
