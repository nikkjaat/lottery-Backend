const Razorpay = require("razorpay");
const crypto = require("crypto");
const User = require("../models/User");
const PaymentHistory = require("../models/PaymentHistory");

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Generate a shorter receipt ID
const generateReceiptId = (userId) => {
  const timestamp = Date.now().toString(36); // Convert to base36 for shorter string
  const userShortId = userId.toString().slice(-8); // Take last 8 chars of user ID
  return `rcpt_${userShortId}_${timestamp}`.substring(0, 40); // Ensure max 40 chars
};

// Create Razorpay order
exports.createOrder = async (req, res) => {
  try {
    const { amount } = req.body;
    const userId = req.user._id;

    if (!amount || amount < 100) {
      return res.status(400).json({
        success: false,
        error: "Minimum deposit amount is ₹100",
      });
    }

    if (amount > 50000) {
      return res.status(400).json({
        success: false,
        error: "Maximum deposit amount is ₹50,000",
      });
    }

    const options = {
      amount: amount * 100, // Convert to paise
      currency: "INR",
      receipt: generateReceiptId(userId),
      notes: {
        userId: userId.toString(),
        purpose: "wallet_recharge",
      },
    };

    const order = await razorpay.orders.create(options);

    // Save payment record as pending
    await PaymentHistory.create({
      userId,
      orderId: order.id,
      amount: amount,
      currency: "INR",
      status: "pending",
      paymentMethod: "razorpay",
    });

    res.status(200).json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        key: process.env.RAZORPAY_KEY_ID,
      },
    });
  } catch (error) {
    console.error("Create order error:", error);

    // Handle specific Razorpay errors
    if (error.error && error.error.description) {
      return res.status(400).json({
        success: false,
        error: error.error.description,
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to create payment order",
    });
  }
};

// Verify Razorpay payment
exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    const userId = req.user._id;

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        error: "Invalid payment signature",
      });
    }

    // Find payment record
    const paymentRecord = await PaymentHistory.findOne({
      orderId: razorpay_order_id,
      userId,
    });

    if (!paymentRecord) {
      return res.status(404).json({
        success: false,
        error: "Payment record not found",
      });
    }

    // Update payment record
    paymentRecord.paymentId = razorpay_payment_id;
    paymentRecord.signature = razorpay_signature;
    paymentRecord.status = "completed";
    paymentRecord.completedAt = new Date();
    await paymentRecord.save();

    // Add amount to user's BONUS balance
    const user = await User.findById(userId);

    // Use the addEarnings method with isDeposit = true
    await user.addEarnings(paymentRecord.amount, false, true);

    res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      amount: paymentRecord.amount,
      newBalance: user.totalEarnings,
      bonusBalance: user.bonusBalance,
      depositBalance: user.depositBalance,
      winningBalance: user.winningBalance,
    });
  } catch (error) {
    console.error("Verify payment error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to verify payment",
    });
  }
};

// Get payment history
exports.getPaymentHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const payments = await PaymentHistory.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await PaymentHistory.countDocuments({ userId });

    res.status(200).json({
      success: true,
      payments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get payment history error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch payment history",
    });
  }
};
