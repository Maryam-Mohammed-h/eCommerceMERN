import nodemailer from "nodemailer";

export async function sendEmailService({
  to,
  subject,
  message,
  attachments = [],
} = {}) {
  // configurations
  const transporter = nodemailer.createTransport({
    host: "localhost", // stmp.gmail.com
    port: 587, // 587 , 465
    secure: false, // false , true
    service: "gmail", // optional
    auth: {
      // credentials
      user: "m.gowifel@gmail.com",
      pass: "sonbarxfiepffhxs",
    },
  });

  const emailInfo = await transporter.sendMail({
    from: "Maryam Hasanin",
    to: to ? to : "",
    subject: subject ? subject : "Hello",
    html: message ? message : "Hello ",
    attachments,
  });
  if (emailInfo.accepted.length) {
    return true;
  }
  return false;
}
