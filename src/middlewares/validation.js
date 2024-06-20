import joi from "joi";
import { Types } from "mongoose";
const reqMethods = ["body", "query", "params", "headers", "file", "files"];
const validationObjectId = (value, helper) => {
  //helper we use it to access in error status
  //Types.ObjectId  => is the schema / rules and  'value' is the data we want to validate .
  return Types.ObjectId.isValid(value) ? true : helper.message("Invalid id");
};
export const generalFields = {
  email: joi
    .string()
    .email({ tlds: { allow: ["com", "net", "org"] } })
    .required(),
  password: joi
    .string()
    .regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/)
    .messages({
      "string.pattern.base": "Password regex fail",
    })
    .required(),
  _id: joi.string().custom(validationObjectId), //we apply the rules we made in the function
};

export const validationCoreFunction = (schema) => {
  return (req, res, next) => {
    // req
    const validationErrorArr = [];
    for (const key of reqMethods) {
      if (schema[key]) {
        const validationResult = schema[key].validate(req[key], {
          abortEarly: false,
        }); // error
        if (validationResult.error) {
          validationErrorArr.push(validationResult.error.details);
        }
      }
    }

    if (validationErrorArr.length) {
      // return res
      //   .status(400)
      //   .json({ message: "Validation Error", Errors: validationErrorArr });
      req.validationErrorArr = validationErrorArr;
      return next(new Error("", { cause: 400 }));
    }
    next();
  };
};
