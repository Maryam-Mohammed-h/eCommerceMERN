//======================================== Signup ==================================================

import { nanoid } from "nanoid";
import { userModel } from "../../../DB/Models/user.model.js";
import { confirmationEmailHtml } from "../../services/email/confirmationEmailHtml.js";
import { resetPasswordEmailHtml } from "../../services/email/resetPasswordEmailHtml.js";
import { sendEmailService } from "../../services/email/sendEmailService.js";
import { generateToken, verifyToken } from "../../utils/tokenFunctions.js";
import pkg from "bcrypt";
export const signUp = async (req, res, next) => {
  const { userName, email, password, phoneNumber, address, gender, age } =
    req.body;
  //email
  const isEmailExist = await userModel.findOne({ email: email.toLowerCase() });
  if (isEmailExist) {
    return next(new Error("This Email is already exists", { cause: 400 }));
  }

  //generate token
  const token = generateToken({
    payload: {
      email,
    },
    signature: process.env.CONFIRMATION_EMAIL_TOKEN,
    expiresIn: "1h",
  });
  //confirm email
  const confirmationLink = `${req.protocol}://${req.headers.host}/auth/confirm/${token}`;

  //refresh token
  const rfToken = generateToken({
    payload: {
      email,
    },
    signature: process.env.CONFIRMATION_EMAIL_TOKEN,
    // expiresIn: "1h",
  });
  //confirm email
  const confirmationLinkRfToken = `${req.protocol}://${req.headers.host}/auth/reConfirm/${rfToken}`;

  const isEmailSent = sendEmailService({
    to: email,
    subject: "Confirmation email",
    message: confirmationEmailHtml({
      link: confirmationLink,
      rfLink: confirmationLinkRfToken,
      linkData: "Click here to confirm your email",
    }),
  });
  if (!isEmailSent) {
    return next(new Error("Fail to send confirmation email", { cause: 400 }));
  }
  const user = new userModel({
    userName,
    email,
    password,
    age,
    gender,
    phoneNumber,
    address,
  });

  const savedUser = await user.save();
  res
    .status(201)
    .json({
      descriptionMessage: "User created successfully ",
      message: "success",
    });
};
export const confirmEmail = async (req, res, next) => {
  const { token } = req.params;
  const decode = verifyToken({
    token,
    signature: process.env.CONFIRMATION_EMAIL_TOKEN,
  });
  if (!decode) {
    return next(new Error("Invalid token", { cause: 400 }));
  }
  const user = await userModel.findOneAndUpdate(
    {
      email: decode?.email,
      isConfirmed: false,
    },
    {
      isConfirmed: true,
    },
    {
      new: true,
    }
  );
  if (!user) {
    return next(new Error("already confirmed", { cause: 400 }));
  }
  res.status(201).json({
    message: "User confirmed successfully ,Please try to login  ",
  });
};
export const refreshConfirmEmail = async (req, res, next) => {
  const { token } = req.params;
  const decode = verifyToken({
    token,
    signature: process.env.CONFIRMATION_EMAIL_TOKEN,
  });
  if (!decode) {
    return next(new Error("Invalid token", { cause: 400 }));
  }
  const user = await userModel.findOne({
    email: decode?.email,
    isConfirmed: false,
  });
  if (!user) {
    return next(
      new Error("Invalid user data or already confirmed", { cause: 400 })
    );
  }

  //generate token
  const rftoken = generateToken({
    payload: {
      email: user.email,
    },
    signature: process.env.CONFIRMATION_EMAIL_TOKEN,
    expiresIn: "1h",
  });
  //confirm email
  const rfLink = `${req.protocol}://${req.headers.host}/auth/confirm/${rftoken}`;

  const isEmailSent = sendEmailService({
    to: user.email,
    subject: "Confirmation email",
    message: confirmationEmailHtml({
      link: rfLink,
      linkData: "Click here to confirm your email",
    }),
  });
  if (!isEmailSent) {
    return next(new Error("Fail to send confirmation email", { cause: 400 }));
  }

  res.status(201).json({
    message: "User confirmed successfully ,Please try to login  ",
  });
};
export const logIn = async (req, res, next) => {
  const { email, password } = req.body;
  const user = await userModel.findOne({ email });
  if (!user) {
    return next(new Error("Invalid user data", { cause: 400 }));
  }
  const passMatch = pkg.compareSync(password, user.password);
  if (!passMatch) {
    return next(new Error("Invalid user data", { cause: 400 }));
  }
  if (user.isConfirmed == false) {
    return next(
      new Error("Please confirm your email first before login ", { cause: 400 })
    );
  }
  const token = generateToken({
    payload: {
      email,
      _id: user._id,
      role: user.role,
    },
    signature: process.env.SIGN_IN_TOKEN_SECRET,
    expiresIn: "1h",
  });
  const userUpdated = await userModel.findOneAndUpdate(
    { email },
    { token, status: "Online" },
    { new: true }
  );
  res.status(201).json({ message: "Done", token });
};

export const forgetPassword = async (req, res, next) => {
  const { email } = req.body;
  const user = await userModel.findOne({ email });
  if (!user) {
    return next(new Error("Invalid email", { cause: 400 }));
  }
  const code = nanoid();
  const hashedCode = pkg.hashSync(code, +process.env.SALT_ROUNDS);
  //generate token
  const token = generateToken({
    payload: {
      email,
      sentCode: hashedCode,
    },
    signature: process.env.RESET_SIGNATURE,
    expiresIn: "1h",
  });
  const resetPasswordLink = `${req.protocol}://${req.headers.host}/auth/reset/${token}`;
  const isEmailSent = sendEmailService({
    to: email,
    subject: "Reset password",
    message: resetPasswordEmailHtml({
      link: resetPasswordLink,
    }),
  });
  if (!isEmailSent) {
    return next(new Error("Fail to send reset Password email", { cause: 400 }));
  }
  const userUpdated = await userModel.findOneAndUpdate(
    { email },
    { forgetCode: hashedCode },
    { new: true }
  );
  res.status(200).json({ message: "You can now reset your password" });
};

export const resetPassword = async (req, res, next) => {
  const { token } = req.params;
  const decoded = verifyToken({
    token,
    signature: process.env.RESET_SIGNATURE,
  });
  if (!decoded) {
    return next(new Error("Invalid token", { cause: 400 }));
  }
  const user = await userModel.findOne({
    email: decoded?.email,
    // forgetCode: decoded?.sentCode,
  });
  if (!user) {
    return next(new Error("user not exist", { cause: 400 }));
  }
  const match = pkg.compareSync(user.forgetCode, decoded?.sentCode);
  if (!match) {
    return next(new Error("Invalid code info", { cause: 400 }));
  }
  const { newPassword } = req.body;

  user.password = newPassword;
  user.forgetCode = null;
  user.changePasswordAt = Date.now();
  const userPasswordReset = await user.save();

  res.status(200).json({ message: "done", userPasswordReset });
};
