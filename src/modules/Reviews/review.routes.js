import { Router } from "express";
const router = Router();
import * as rc from "./review.controller.js";
import { asyncHandler } from "../../utils/errorhandling.js";
import * as validators from "./reviews.validationSchemas.js";
import { validationCoreFunction } from "../../middlewares/validation.js";
import { isAuth } from "../../middlewares/auth.js";
import { systemRoles } from "../../utils/systemRoles.js";
router.post(
  "/",
  isAuth([systemRoles.USER]),
  validationCoreFunction(validators.addReviewSchema),
  asyncHandler(rc.addReview)
);

export default router;
