import { Router } from "express";
import { multerCloudFunction } from "../../services/multerCloud.js";
import { allowedExtensions } from "../../utils/allowedExtensions.js";
import { asyncHandler } from "../../utils/errorhandling.js";
import * as ac from "./auth.controller.js";
import { validationCoreFunction } from "../../middlewares/validation.js";
import * as validators from "./auth.validationSchemas.js";

const router = Router();

router.post(
  "/",
  asyncHandler(ac.signUp)
);
router.get("/confirm/:token", asyncHandler(ac.confirmEmail));
router.get("/reConfirm/:token", asyncHandler(ac.refreshConfirmEmail));

router.post("/login", asyncHandler(ac.logIn));
router.post("/forget", asyncHandler(ac.forgetPassword));
router.post("/reset/:token", asyncHandler(ac.resetPassword));
export default router;
