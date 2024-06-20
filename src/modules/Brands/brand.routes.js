import { Router } from "express";
import { multerCloudFunction } from "../../services/multerCloud.js";
import { allowedExtensions } from "../../utils/allowedExtensions.js";
import { asyncHandler } from "../../utils/errorhandling.js";
import * as bc from "./brand.controller.js";
import { validationCoreFunction } from "../../middlewares/validation.js";
import * as validators from "./brand.validationSchemas.js";
import { isAuth } from "../../middlewares/auth.js";
import { systemRoles } from "../../utils/systemRoles.js";
const router = Router();

router.post(
  "/",
  multerCloudFunction(allowedExtensions.Image).single("logo"),
  validationCoreFunction(validators.createBrandSchema),
  isAuth([systemRoles.ADMIN, systemRoles.SUPER_ADMIN]),
  asyncHandler(bc.createBrand)
);

router.put(
  "/:brandId",
  multerCloudFunction(allowedExtensions.Image).single("logo"),
  validationCoreFunction(validators.updateBrandSchema),
  isAuth([systemRoles.ADMIN, systemRoles.SUPER_ADMIN]),
  asyncHandler(bc.updateBrand)
);

router.get("/", asyncHandler(bc.getAllBrands));
router.delete(
  "/:brandId",
  isAuth([systemRoles.ADMIN, systemRoles.SUPER_ADMIN]),
  asyncHandler(bc.deleteBrand)
);
export default router;
