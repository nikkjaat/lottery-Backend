const validator = require("validator");

const validateEmail = (email) => {
  return validator.isEmail(email);
};

const validateSignup = (req, res, next) => {
  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).json({
      success: false,
      error: "Name and email are required",
    });
  }

  if (!validateEmail(email)) {
    return res.status(400).json({
      success: false,
      error: "Please provide a valid email",
    });
  }

  if (name.length < 2 || name.length > 50) {
    return res.status(400).json({
      success: false,
      error: "Name must be between 2 and 50 characters",
    });
  }

  next();
};

const validateOTP = (req, res, next) => {
  const { email, otp } = req.body;

  // For login OTP sending, only email is required
  if (req.path === "/login" || req.path === "/signup") {
    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Email is required",
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        error: "Please provide a valid email",
      });
    }
  } else {
    // For verification endpoints, both email and OTP are required
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        error: "Email and OTP are required",
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        error: "Please provide a valid email",
      });
    }

    if (otp.length !== 6 || !/^\d+$/.test(otp)) {
      return res.status(400).json({
        success: false,
        error: "OTP must be 6 digits",
      });
    }
  }

  next();
};

module.exports = { validateSignup, validateOTP };
