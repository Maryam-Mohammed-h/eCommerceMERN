import joi from "joi";

export const createSubCategorySchema = {
  body: joi
    .object({
      name: joi.string().min(4).max(25),
    })
    .required()
    .options({ presence: "required" }),
};
export const updateSubCategorySchema = {
  body: joi
    .object({
      name: joi.string().min(4).max(25).optional(),
    })
    .required(),
};
