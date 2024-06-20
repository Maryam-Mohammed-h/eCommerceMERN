import Joi from "joi";
import { generalFields } from "../../middlewares/validation.js";

export const createCouponValidationSchema = {
  body: Joi.object({
    code: Joi.string().min(5).max(55).required(),
    isPercentage: Joi.boolean().optional(),
    isFixedAmount: Joi.boolean().optional(),
    amount: Joi.number()
      .positive()
      .min(1)
      .required()
      .when("isPercentage", {
        is: true,
        then: Joi.number().positive().min(1).required().max(100),
      }),

    fromDate: Joi.date()
      .greater(Date.now() - 24 * 60 * 60 * 1000)
      .required(),
    toDate: Joi.date().greater(Joi.ref("fromDate")).required(),
    couponBased: Joi.string().valid("Quantity", "Discount").optional(),
    couponQuantityDetecting: Joi.number()
      .positive()
      .min(1)
      .optional()
      .when("couponBased", {
        is: "Quantity",
        then: Joi.number().positive().min(1).required(),
      }),
    usageMaxLimitNumber: Joi.number().positive().optional(),
    // couponAssginedToUsers: Joi.array().items().required(),
  }).required(),
};

// Joi.object().keys({
//   contact: Joi.object().keys({
//       first_name: Joi.string(),
//       last_name: Joi.string(),
//       phone: Joi.string(),
//   }),
//   address: Joi.object().keys({
//       place: Joi.string(),
//       city: Joi.string().min(2).max(30),
//       street: Joi.string(),
//       house_number: Joi.string()
//   }).when('contact', {
//       is: Joi.object().keys({
//           first_name: Joi.exist(),
//           last_name: Joi.exist(),
//           phone: Joi.exist(),
//       }),
//       then: Joi.object({ place: Joi.required() }).required(),
//       otherwise: Joi.object({ place: Joi.forbidden() })
//   }),

export const deleteCouponValidationSchema = {
  params: Joi.object({
    couponId: generalFields._id.required(),
  }).required(),
};
