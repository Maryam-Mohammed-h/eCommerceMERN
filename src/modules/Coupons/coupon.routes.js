import { Router } from "express";
import { asyncHandler } from "../../utils/errorhandling.js";
import * as cc from "./coupon.controller.js";
import { validationCoreFunction } from "../../middlewares/validation.js";
import * as validators from "./coupon.validationSchemas.js";
import { isAuth } from "../../middlewares/auth.js";
import { systemRoles } from "../../utils/systemRoles.js";
const router = Router();

router.post(
  "/",
  isAuth([systemRoles.ADMIN, systemRoles.SUPER_ADMIN]),
  validationCoreFunction(validators.createCouponValidationSchema),
  asyncHandler(cc.createCoupon)
);

router.put(
  "/:couponId",
  isAuth([systemRoles.ADMIN, systemRoles.SUPER_ADMIN]),
  //   validationCoreFunction(validators.updateCategorySchema),
  asyncHandler(cc.updateCoupon)
);

router.delete(
  "/:couponId",
  isAuth([systemRoles.ADMIN, systemRoles.SUPER_ADMIN]),
  validationCoreFunction(validators.deleteCouponValidationSchema),

  asyncHandler(cc.deleteCoupon)
);
export default router;
