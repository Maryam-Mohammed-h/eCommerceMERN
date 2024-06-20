import { Router } from "express";
import { asyncHandler } from "../../utils/errorhandling.js";
import * as oc from "./order.controller.js";
import { isAuth } from "../../middlewares/auth.js";
import { systemRoles } from "../../utils/systemRoles.js";
const router = Router();

router.post("/", isAuth([systemRoles.USER]), asyncHandler(oc.createOrder));
router.post(
  "/orderCart",
  isAuth([systemRoles.USER]),
  asyncHandler(oc.fromCartToOrder)
);

// router.put(
//   "/:couponId",
//   //   validationCoreFunction(validators.updateCategorySchema),
//   asyncHandler(oc.updateCoupon)
// );

export default router;
