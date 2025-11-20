const User = require("../models/User");
const WithdrawalRequest = require("../models/WithdrawalRequest");

// Request withdrawal
exports.requestWithdrawal = async (req, res) => {
  try {
    const userId = req.user._id;
    const { amount, accountHolderName, accountNumber, ifscCode, bankName } =
      req.body;

    // Validation
    if (!amount || amount < 100) {
      return res.status(400).json({
        success: false,
        error: "Minimum withdrawal amount is ₹100",
      });
    }

    if (amount > 50000) {
      return res.status(400).json({
        success: false,
        error: "Maximum withdrawal amount is ₹50,000 per day",
      });
    }

    if (!accountHolderName || !accountNumber || !ifscCode) {
      return res.status(400).json({
        success: false,
        error: "All bank details are required",
      });
    }

    const user = await User.findById(userId);

    if (user.winningBalance < amount) {
      return res.status(400).json({
        success: false,
        error: "Insufficient winning balance",
      });
    }

    // Check daily withdrawal limit
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayWithdrawals = await WithdrawalRequest.aggregate([
      {
        $match: {
          userId: userId,
          createdAt: { $gte: today, $lt: tomorrow },
          status: { $in: ["pending", "approved"] },
        },
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$amount" },
        },
      },
    ]);

    const todayTotal = todayWithdrawals[0]?.totalAmount || 0;

    if (todayTotal + amount > 50000) {
      return res.status(400).json({
        success: false,
        error: `Daily withdrawal limit exceeded. You can withdraw ₹${
          50000 - todayTotal
        } more today.`,
      });
    }

    // Create withdrawal request
    const withdrawalRequest = await WithdrawalRequest.create({
      userId,
      amount,
      accountHolderName,
      accountNumber,
      ifscCode,
      bankName,
      status: "pending",
    });

    // Deduct amount from winning balance (hold it)
    user.winningBalance -= amount;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Withdrawal request submitted successfully",
      withdrawalRequest: {
        id: withdrawalRequest._id,
        amount: withdrawalRequest.amount,
        status: withdrawalRequest.status,
        createdAt: withdrawalRequest.createdAt,
      },
      newWinningBalance: user.winningBalance,
    });
  } catch (error) {
    console.error("Request withdrawal error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to process withdrawal request",
    });
  }
};

// Get withdrawal history
exports.getWithdrawalHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const withdrawals = await WithdrawalRequest.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await WithdrawalRequest.countDocuments({ userId });

    res.status(200).json({
      success: true,
      withdrawals,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get withdrawal history error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch withdrawal history",
    });
  }
};

// Get withdrawal requests (for admin)
exports.getWithdrawalRequests = async (req, res) => {
  try {
    const status = req.query.status || "pending";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const requests = await WithdrawalRequest.find({ status })
      .populate("userId", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await WithdrawalRequest.countDocuments({ status });

    res.status(200).json({
      success: true,
      requests,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get withdrawal requests error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch withdrawal requests",
    });
  }
};
