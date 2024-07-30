import { Router } from "express";
import { asyncHandler } from "../../utils/errorhandling.js";
import * as cc from "./cart.controller.js";
import { validationCoreFunction } from "../../middlewares/validation.js";
import * as validators from "./cart.validationSchemas.js";
import { isAuth } from "../../middlewares/auth.js";
import { systemRoles } from "../../utils/systemRoles.js";
const router = Router();

router.post(
  "/",
  isAuth([systemRoles.USER]),
  // validationCoreFunction(validators.createCouponValidationSchema),
  asyncHandler(cc.addToCart)
);
router.get(
  "/",
  isAuth([systemRoles.USER]),
  // validationCoreFunction(validators.createCouponValidationSchema),
  asyncHandler(cc.getUserCart)
);
router.delete(
  "/",
  isAuth([systemRoles.USER]),

  asyncHandler(cc.deleteFromCart)
);
export default router;
