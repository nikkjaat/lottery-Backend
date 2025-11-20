const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true,
    maxlength: [50, "Name cannot be more than 50 characters"],
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    validate: {
      validator: function (email) {
        return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email);
      },
      message: "Please enter a valid email",
    },
  },
  mobile: {
    type: String,
    validate: {
      validator: function (mobile) {
        return !mobile || /^[0-9]{10}$/.test(mobile);
      },
      message: "Please enter a valid 10-digit mobile number",
    },
  },
  otp: {
    type: String,
    select: false,
  },
  otpExpires: {
    type: Date,
    select: false,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  hasFreeSpin: {
    type: Boolean,
    default: true,
  },
  totalEarnings: {
    type: Number,
    default: 0,
  },
  bonusBalance: {
    type: Number,
    default: 0,
  },
  depositBalance: {
    type: Number,
    default: 0,
  },
  winningBalance: {
    type: Number,
    default: 0,
  },
  hasMultiplier: {
    type: Boolean,
    default: false,
  },
  multiplierValue: {
    type: Number,
    default: 1,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastSpinAt: {
    type: Date,
  },
  lastDailyBonus: {
    type: Date,
  },
});

// Hash OTP before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("otp")) return next();

  if (this.otp) {
    const salt = await bcrypt.genSalt(10);
    this.otp = await bcrypt.hash(this.otp, salt);
  }
  next();
});

// Method to compare OTP
userSchema.methods.compareOTP = async function (enteredOTP) {
  return await bcrypt.compare(enteredOTP, this.otp);
};

// Method to add earnings - CORRECTED VERSION
userSchema.methods.addEarnings = async function (
  amount,
  isBonus = false,
  isDeposit = false
) {
  this.totalEarnings += amount;

  if (isBonus) {
    this.bonusBalance += amount;
  } else if (isDeposit) {
    this.depositBalance += amount;
  } else {
    this.winningBalance += amount;
  }

  await this.save();
  return this;
};

// Method to deduct spin cost
userSchema.methods.deductSpinCost = async function (cost = 50) {
  if (this.totalEarnings < cost) {
    throw new Error("Insufficient balance for spin");
  }
  this.totalEarnings -= cost;
  await this.save();
  return this.totalEarnings;
};

// Method to add winnings
userSchema.methods.addWinnings = async function (amount) {
  this.totalEarnings += amount;
  this.winningBalance += amount; // Winnings go to winning balance
  await this.save();
  return this.totalEarnings;
};

module.exports = mongoose.model("User", userSchema);
