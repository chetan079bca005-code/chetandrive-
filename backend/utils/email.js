import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: process.env.SMTP_PORT || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendEmailOTP = async (to, otp) => {
  const mailOptions = {
    from: process.env.SMTP_FROM || '"SocialHub" <godsays900@gmail.com>',
    to,
    subject: "Your Login OTP for Ride Booking App",
    text: `Your One-Time Password (OTP) is: ${otp}\n\nIt expires in 10 minutes.`,
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
        <h2 style="color: #333;">Welcome!</h2>
        <p>Your One-Time Password (OTP) to sign in is:</p>
        <div style="font-size: 24px; font-weight: bold; background: #eee; padding: 10px; text-align: center; border-radius: 4px; letter-spacing: 5px;">
          ${otp}
        </div>
        <p style="margin-top: 20px; font-size: 12px; color: #777;">This OTP will expire in 10 minutes. Do not share this code with anyone.</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: %s", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending email config:", error);
    throw new Error("Failed to send OTP email");
  }
};
