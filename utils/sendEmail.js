const transporter = require("../config/email");

const sendEmail = async (to, subject, html) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      html,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Email sending error:", error);
    return false;
  }
};

const sendOTPEmail = async (email, name, otp) => {
  const subject = "Your Achie Coins Verification OTP";
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #3B82F6; text-align: center;">Achie Coins</h2>
      <div style="background: #f8fafc; padding: 20px; border-radius: 10px;">
        <h3>Hello ${name},</h3>
        <p>Your OTP for verification is:</p>
        <div style="text-align: center; margin: 30px 0;">
          <span style="font-size: 32px; font-weight: bold; color: #3B82F6; letter-spacing: 8px;">
            ${otp}
          </span>
        </div>
        <p>This OTP will expire in 10 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
      </div>
      <p style="text-align: center; color: #64748b; margin-top: 20px;">
        © 2024 Achie Coins. All rights reserved.
      </p>
    </div>
  `;

  return await sendEmail(email, subject, html);
};

module.exports = { sendEmail, sendOTPEmail };
