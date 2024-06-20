import Joi from "joi";
import { generalFields } from "../../middlewares/validation.js";

export const createCartValidationSchema = {
  body: Joi.object({}).required(),
};

export const deleteCouponValidationSchema = {
  params: Joi.object({
    _id: generalFields._id.required(),
  }).required(),
};
