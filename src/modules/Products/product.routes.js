import { Router } from "express";
import { multerCloudFunction } from "../../services/multerCloud.js";
import { allowedExtensions } from "../../utils/allowedExtensions.js";
import { asyncHandler } from "../../utils/errorhandling.js";
import * as pc from "./product.controller.js";
import { validationCoreFunction } from "../../middlewares/validation.js";
import * as validators from "./product.validationSchemas.js";
import { isAuth } from "../../middlewares/auth.js";
import { systemRoles } from "../../utils/systemRoles.js";

const router = Router();

router.post(
  "/",
  multerCloudFunction(allowedExtensions.Image).array("image", 3),
  validationCoreFunction(validators.createProductSchema),
  isAuth([systemRoles.ADMIN, systemRoles.SUPER_ADMIN]),
  asyncHandler(pc.addProduct)
);

router.put(
  "/:productId",
  multerCloudFunction(allowedExtensions.Image).array("image"),
  validationCoreFunction(validators.updateProductSchema),
  isAuth([systemRoles.ADMIN, systemRoles.SUPER_ADMIN]),
  asyncHandler(pc.updateProduct)
);
router.get("/:productId", asyncHandler(pc.getProduct));
router.get("/", asyncHandler(pc.listProducts));
router.get("/search", asyncHandler(pc.searchProduct));

router.delete(
  "/:productId",
  isAuth([systemRoles.ADMIN, systemRoles.SUPER_ADMIN]),
  asyncHandler(pc.deleteProduct)
);
export default router;
