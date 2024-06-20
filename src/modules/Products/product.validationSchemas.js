import joi from "joi";
import { generalFields } from "../../middlewares/validation.js";

export const createProductSchema = {
  body: joi.object({
    title: joi.string().min(4).max(20).required(),
    desc: joi.string().min(4).max(100).optional(),
    price: joi.number().integer().positive().min(1).required(),
    stock: joi.number().integer().positive().min(1).required(),
    colors: joi.optional(),
    sizes: joi.optional(),
    appliedDiscount: joi.optional().default(0),
  }),
  query: joi
    .object({
      categoryId: generalFields._id,
      subCategoryId: generalFields._id,
      brandId: generalFields._id,
    })
    .required()
    .options({ presence: "required" }),
};

export const updateProductSchema = {
  body: joi
    .object({
      title: joi.string().min(4).max(20).optional(),
      desc: joi.string().min(4).max(100).optional(),
      price: joi.number().integer().positive().min(1),
      stock: joi.number().integer().positive().min(1),

      colors: joi.optional(),
      sizes: joi.optional(),
      appliedDiscount: joi.optional(),
    })
    .required(),
};
