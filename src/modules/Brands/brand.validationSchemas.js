import joi from "joi";

export const createBrandSchema = {
  body: joi
    .object({
      name: joi.string().min(4).max(15),
      desc: joi.string().min(4).max(100),
    })
    .required()
    .options({ presence: "required" }),
};

export const updateBrandSchema = {
  body: joi
    .object({
      name: joi.string().min(4).max(15).optional(),
      desc: joi.string().min(4).max(100).optional(),
    })
    .required(),
};
