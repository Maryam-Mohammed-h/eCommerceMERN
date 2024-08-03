import { couponModel } from "../../../DB/Models/coupon.model.js";
import { orderModel } from "../../../DB/Models/order.model.js";
import { productModel } from "../../../DB/Models/product.model.js";
import { isCouponValid } from "../../utils/couponValidation.js";
import { cartModel } from "../../../DB/Models/cart.model.js";
import { customAlphabet } from "nanoid";
import createInvoice from "../../utils/pdfkit.js";
import { sendEmailService } from "../../services/email/sendEmailService.js";
import { qrCodeFunction } from "../../utils/qrCodeFunction.js";
import { paymentFunction } from "../../utils/payment.js";
import { generateToken, verifyToken } from "../../utils/tokenFunctions.js";
import Stripe from "stripe";
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
    // ============================= order payment =====================
    let orderSession;
    const orderToken = generateToken({
      payload: { orderId: orderDB._id },
      signature: process.env.ORDER_TOKEN,
      expiresIn: "1h",
    });
    if (orderDB.paymentMethod == "Card") {
      if (req.coupon) {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
        let coupon;
        if (req.coupon.isPercentage) {
          coupon = await stripe.coupons.create({
            percent_off: req.coupon.amount,
          });
        }
        if (req.coupon.isFixedAmount) {
          if (req.coupon.amount > orderDB.subTotal) {
            req.coupon.amount = orderDB.subTotal;
          }
          coupon = await stripe.coupons.create({
            amount_off: req.coupon.amount * 100,
            currency: "EGP",
          });
        }
        req.couponID = coupon.id;
      }
      orderSession = await paymentFunction({
        payment_method_types: ["card"],
        mode: "payment",
        customer_email: req.authUser.email,
        metadata: { orderId: orderDB._id.toString() },
        success_url: `${req.protocol}://${req.headers.host}/order/successOrder?token=${orderToken}`,
        cancel_url: `${req.protocol}://${req.headers.host}/order/cancelOrder?token=${orderToken}`,
        discounts: req.couponID ? [{ coupon: req.couponID }] : [],
        line_items: orderDB.products.map((product) => {
          return {
            price_data: {
              currency: "EGP",
              product_data: {
                name: product.title,
              },
              unit_amount: product.price * 100,
            },
            quantity: product.quantity,
          };
        }),
      });
    }

    // ================ qr code ======================
    const qrCode = await qrCodeFunction({
      data: { orderId: orderDB._id, products: orderDB.products },
    });
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

    return res.status(201).json({
      message: "success",
      orderDB,
      checkOutPage: orderSession.url,
    });
  }
};
// ################################################################
export const fromCartToOrder = async (req, res, next) => {
  const userId = req.authUser._id;
  // const { cartId } = req.params;
  const { address, phoneNumber, paymentMethod, couponCode ,notesForOrder} = req.body;
  const cart = await cartModel.findOne({ userId });
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
    notesForOrder,
    paymentMethod,
    orderStatus,
    couponId: req.coupon?._id,
  };
  const orderDB = await orderModel.create(orderObj);
  if (orderDB) {
    // ============================= order payment =====================
    let orderSession;
    const orderToken = await generateToken({
      payload: { orderId: orderDB._id },
      signature: process.env.ORDER_TOKEN,
      expiresIn: "1h",
    });
    if (orderDB.paymentMethod == "Card") {
      if (req.coupon) {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
        let coupon;
        if (req.coupon.isPercentage) {
          coupon = await stripe.coupons.create({
            percent_off: req.coupon.amount,
          });
        }
        if (req.coupon.isFixedAmount) {
          if (req.coupon.amount > orderDB.subTotal) {
            req.coupon.amount = orderDB.subTotal;
          }
          coupon = await stripe.coupons.create({
            amount_off: req.coupon.amount * 100,
            currency: "EGP",
          });
        }
        req.couponID = coupon.id;
      }
      console.log(
        `${req.protocol}://${req.headers.host}/order/cancelOrder?token=${orderToken}`
      );
      orderSession = await paymentFunction({
        payment_method_types: ["card"],
        mode: "payment",
        customer_email: req.authUser.email,
        metadata: { orderId: orderDB._id.toString() },
        success_url: `${req.protocol}://${req.headers.host}/order/successOrder?token=${orderToken}`,
        cancel_url: `${req.protocol}://${req.headers.host}/order/cancelOrder?token=${orderToken}`,
        discounts: req.couponID ? [{ coupon: req.couponID }] : [],
        line_items: orderDB.products.map((product) => {
          return {
            price_data: {
              currency: "EGP",
              product_data: {
                name: product.title,
              },
              unit_amount: product.price * 100,
            },
            quantity: product.quantity,
          };
        }),
      });
    }

    // ================ qr code ======================
    const qrCode = await qrCodeFunction({
      data: { orderId: orderDB._id, products: orderDB.products },
    });
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
    cart.subTotal=0;
    await cart.save();

    return res.status(201).json({
      message: "success",
      descriptionMessage:"Order added successfully",
      orderDB,
      checkOutPage: orderSession.url,
    });
  }

  return next(
    new Error(`Failed to make new order, please try again later`, {
      cause: 400,
    })
  );
};

// ============================= success payment  ===================
export const successPayment = async (req, res, next) => {
  const { token } = req.query;
  const decodeData = verifyToken({ token, signature: process.env.ORDER_TOKEN });
  const order = await orderModel.findOne({
    _id: decodeData.orderId,
    orderStatus: "Pending",
  });
  if (!order) {
    return next(new Error("invalid order id", { cause: 400 }));
  }
  order.orderStatus = "Confirmed";
  await order.save();
  // res.redirect('http://localhost'+req.url)
  // res.status(200).json({ message: "success", order });
  // res.redirect(`http://localhost:3000/order/${_id}`)
  res.writeHead(301, {
    Location: `http://localhost:3000/orde/${_id}`
  }).end();

};

//================================ cancel payment =====================
export const cancelPayment = async (req, res, next) => {
  const { token } = req.query;
  const decodeData = verifyToken({ token, signature: process.env.ORDER_TOKEN });
  const order = await orderModel.findOne({ _id: decodeData.orderId });
  if (!order) {
    return next(new Error("invalid order id", { cause: 400 }));
  }

  //=============== approch one ====> orderSatatus:'Cancelled'
  order.orderStatus = "Cancelled";
  await order.save();
  //================ approach two ====>delete from db
  // await orderModel.findOneAndDelete({ _id: decodeData.orderId })

  //=================== undo prouducts  and coupon  ====================
  for (const product of order.products) {
    await productModel.findByIdAndUpdate(product.productId, {
      $inc: { stock: parseInt(product.quantity) },
    });
  }

  if (order.couponId) {
    const coupon = await couponModel.findById(order.couponId);
    if (!coupon) {
      return next(new Error("invalid coupon id"));
    }
    // coupon.couponAssginedToUsers.map((ele) => {
    //   if (order.userId.toString() == ele.userId.toString()) {
    //     ele.usageCount -= 1;
    //   }
    // });

    await coupon.save();
  }
  res.status(200).json({ message: "success", order });
};
// ================================ mark the order as delivered ===================
export const deliverOrder = async (req, res, next) => {
  const { orderId } = req.query;

  const order = await orderModel.findOneAndUpdate(
    {
      _id: orderId,
      orderStatus: { $nin: ["Delivered", "Cancelled", "Rejected", "Pending"] },
    },
    {
      orderStatus: "Delivered",
    },
    {
      new: true,
    }
  );

  if (!order) {
    return next(new Error("invalid order", { cause: 400 }));
  }

  return res.status(200).json({ message: "success", order });
};
