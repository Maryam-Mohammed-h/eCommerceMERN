import { cartModel } from "../../../DB/Models/cart.model.js";
import { productModel } from "../../../DB/Models/product.model.js";

// ========================================== add to cart ==========================================
export const addToCart = async (req, res, next) => {
  const { productId, quantity } = req.body;
  const userId = req.authUser._id;
  // ============ product check============
  const product = await productModel.findOne({
    _id: productId,
  });
  if (!product) {
    return next(new Error("This product is not available", { cause: 400 }));
  }
  const productQuantity = await productModel.findOne({
    _id: productId,
    stock: { $gte: quantity },
  });
  if (!productQuantity) {
    return next(new Error("Not enough elements in stock ", { cause: 400 }));
  }
  const userCart = await cartModel.findOne({ userId }).lean();

  // =======if there is exist cart for this user=========
  if (userCart) {
    //update quantity
    let productAlreadyExist = false;
    for (const prod of userCart.products) {
      if (productId == prod.productId) {
        productAlreadyExist = true;
        prod.quantity = quantity;
      }
    }
    //push new product
    if (!productAlreadyExist) {
      userCart.products.push({ productId, quantity });
    }
    //subTotal
    let subTotal = 0;
    for (const prod of userCart.products) {
      const prodExist = await productModel.findById(prod.productId);
      subTotal += prodExist.priceAfterDiscount * prod.quantity || 0;
    }
    const newProductCart = await cartModel.findOneAndUpdate(
      { userId },
      {
        subTotal,
        products: userCart.products,
      },
      { new: true }
    ).populate({path:'products.productId',select:'title priceAfterDiscount Images'});
    res.status(201).json({ message: "success", descriptionMessage:"Item added to cart successfully",newProductCart });
  } else {
    // =======if there is not exist cart for this user=========
    const cartObj = {
      userId,
      products: [{ productId, quantity }],
      subTotal: product.priceAfterDiscount * quantity,
    };
    const cartItem = await cartModel.create(cartObj);
    if (!cartItem) {
      return next(
        new Error("try again later , fail to add to cart", { cause: 400 })
      );
    }
    res.status(201).json({ message: "success",descriptionMessage:"Item added to cart successfully", cartItem });
  }
};

// ================================= Delete Product  =================================
export const deleteFromCart = async (req, res, next) => {
  const { productId } = req.body;
  const userId = req.authUser._id;
  // get product by id
  const productExist = await productModel.findOne({ _id: productId });

  if (!productExist) {
    return next(new Error("Invalid product id ", { cause: 400 }));
  }
  const userCart = await cartModel.findOne({
    userId,
    "products.productId": productId,
  }).populate({path:'products.productId',select:'title priceAfterDiscount Images'});
  if (!userCart) {
    return next(new Error("No cart items", { cause: 400 }));
  }
  userCart.products.forEach((ele) => {
    if (ele.productId._id == productId) {
      userCart.products.splice(userCart.products.indexOf(ele), 1);
    }
  });
  await userCart.save();
  res.status(200).json({ message: "success",descriptionMessage:"Item deleted from cart successfully", userCart });
};
// ========================= getUserCart=================
export const getUserCart = async (req, res, next) => {
  const userId = req.authUser._id;
  // get product by id
  const userCart = await cartModel.findOne({userId }).populate({path:'products.productId',select:'title priceAfterDiscount Images'});

  if (!userCart) {
    return next(new Error("Invalid cart data", { cause: 400 }));
  }

  res.status(200).json({ message: "success", userCart });
};
// =