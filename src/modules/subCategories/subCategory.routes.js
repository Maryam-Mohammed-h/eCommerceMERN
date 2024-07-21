import { Router } from "express";
import * as sc from "./subCategory.controller.js";
import { multerCloudFunction } from "../../services/multerCloud.js";
import { allowedExtensions } from "../../utils/allowedExtensions.js";
import { asyncHandler } from "../../utils/errorhandling.js";
import * as validators from "./subCategory.validationSchemas.js";
import { validationCoreFunction } from "../../middlewares/validation.js";
import { isAuth } from "../../middlewares/auth.js";
import { systemRoles } from "../../utils/systemRoles.js";
// const router = Router({ mergeParams: true });
const router = Router();

router.post(
  "/:categoryId",
  multerCloudFunction(allowedExtensions.Image).single("image"),
  validationCoreFunction(validators.createSubCategorySchema),
  isAuth([systemRoles.ADMIN, systemRoles.SUPER_ADMIN]),
  asyncHandler(sc.createSubCategory)
);
router.put(
  "/:categoryId/:subCategoryId",
  multerCloudFunction(allowedExtensions.Image).single("image"),
  validationCoreFunction(validators.updateSubCategorySchema),
  isAuth([systemRoles.ADMIN, systemRoles.SUPER_ADMIN]),
  asyncHandler(sc.updateSubCategory)
);
router.get("/:categoryId", asyncHandler(sc.getAllSubCategories));
router.delete(
  "/:subCategoryId",
  isAuth([systemRoles.ADMIN, systemRoles.SUPER_ADMIN]),
  asyncHandler(sc.deleteSubCategory)
);

export default router;
