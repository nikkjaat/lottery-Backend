const User = require("../models/User");
const generateOTP = require("../utils/generateOTP");
const { sendOTPEmail } = require("../utils/sendEmail");
const jwt = require("jsonwebtoken");

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

// Send OTP for signup
exports.sendSignupOTP = async (req, res) => {
  try {
    const { name, email } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: "User already exists with this email",
      });
    }

    const otp = generateOTP();
    const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Create unverified user
    const user = await User.create({
      name,
      email,
      otp,
      otpExpires,
      isVerified: false,
    });

    // Send OTP email
    const emailSent = await sendOTPEmail(email, name, otp);

    if (!emailSent) {
      await User.findByIdAndDelete(user._id);
      return res.status(500).json({
        success: false,
        error: "Failed to send OTP email",
      });
    }

    res.status(200).json({
      success: true,
      message: "OTP sent successfully",
      otp: process.env.NODE_ENV === "development" ? otp : undefined, // Send OTP only in development
    });
  } catch (error) {
    console.error("Send OTP error:", error);
    res.status(500).json({
      success: false,
      error: "Server error while sending OTP",
    });
  }
};

// Verify OTP and complete signup
exports.verifySignupOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email }).select("+otp +otpExpires");

    if (!user) {
      return res.status(400).json({
        success: false,
        error: "User not found",
      });
    }

    if (user.otpExpires < Date.now()) {
      return res.status(400).json({
        success: false,
        error: "OTP has expired",
      });
    }

    const isOTPValid = await user.compareOTP(otp);
    if (!isOTPValid) {
      return res.status(400).json({
        success: false,
        error: "Invalid OTP",
      });
    }

    // Mark user as verified and clear OTP
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;

    // Add welcome bonus for first verification
    let bonusAdded = 0;
    if (!user.totalEarnings && !user.bonusBalance) {
      bonusAdded = 20;
      await user.addEarnings(bonusAdded, true);
    } else {
      await user.save();
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        totalEarnings: user.totalEarnings,
        bonusBalance: user.bonusBalance,
        hasFreeSpin: user.hasFreeSpin,
      },
      bonusAdded,
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    res.status(500).json({
      success: false,
      error: "Server error while verifying OTP",
    });
  }
};

// Send OTP for login
exports.sendLoginOTP = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found. Please sign up first.",
      });
    }

    const otp = generateOTP();
    const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    // Send OTP email
    const emailSent = await sendOTPEmail(email, user.name, otp);

    if (!emailSent) {
      return res.status(500).json({
        success: false,
        error: "Failed to send OTP email",
      });
    }

    res.status(200).json({
      success: true,
      message: "OTP sent successfully",
      otp: process.env.NODE_ENV === "development" ? otp : undefined,
    });
  } catch (error) {
    console.error("Send login OTP error:", error);
    res.status(500).json({
      success: false,
      error: "Server error while sending login OTP",
    });
  }
};

// Verify login OTP
exports.verifyLoginOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email }).select("+otp +otpExpires");

    if (!user) {
      return res.status(400).json({
        success: false,
        error: "User not found",
      });
    }

    if (user.otpExpires < Date.now()) {
      return res.status(400).json({
        success: false,
        error: "OTP has expired",
      });
    }

    const isOTPValid = await user.compareOTP(otp);
    if (!isOTPValid) {
      return res.status(400).json({
        success: false,
        error: "Invalid OTP",
      });
    }

    // Clear OTP and update last login
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        totalEarnings: user.totalEarnings,
        bonusBalance: user.bonusBalance,
        hasFreeSpin: user.hasFreeSpin,
      },
    });
  } catch (error) {
    console.error("Verify login OTP error:", error);
    res.status(500).json({
      success: false,
      error: "Server error while verifying login OTP",
    });
  }
};
