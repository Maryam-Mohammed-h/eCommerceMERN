import { Router } from "express";
import { multerCloudFunction } from "../../services/multerCloud.js";
import { allowedExtensions } from "../../utils/allowedExtensions.js";
import { asyncHandler } from "../../utils/errorhandling.js";
import * as cc from "./category.contoller.js";
import { validationCoreFunction } from "../../middlewares/validation.js";
import * as validators from "./category.validationSchemas.js";
import subCategoryRouter from "../subCategories/subCategory.routes.js";
import { isAuth } from "../../middlewares/auth.js";
import { systemRoles } from "../../utils/systemRoles.js";

const router = Router();

// router.use("/:categoryId", subCategoryRouter);

router.post(
  "/",
  isAuth([systemRoles.ADMIN, systemRoles.SUPER_ADMIN]),
  multerCloudFunction(allowedExtensions.Image).single("image"),
  validationCoreFunction(validators.createCategorySchema),
  asyncHandler(cc.createCategory)
);

router.put(
  "/:categoryId",
  isAuth([systemRoles.ADMIN, systemRoles.SUPER_ADMIN]),
  multerCloudFunction(allowedExtensions.Image).single("image"),
  validationCoreFunction(validators.updateCategorySchema),
  asyncHandler(cc.updateCategory)
);

router.get("/", asyncHandler(cc.getAllCategories));
router.delete(
  "/:categoryId",
  isAuth([systemRoles.ADMIN, systemRoles.SUPER_ADMIN]),
  asyncHandler(cc.deleteCategory)
);
export default router;
