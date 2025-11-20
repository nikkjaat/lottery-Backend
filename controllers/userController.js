const User = require("../models/User");
const GameHistory = require("../models/GameHistory");

// Get user profile
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    const gameHistory = await GameHistory.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        totalEarnings: user.totalEarnings,
        bonusBalance: user.bonusBalance,
        depositBalance: user.depositBalance,
        winningBalance: user.winningBalance,
        hasFreeSpin: user.hasFreeSpin,
        hasMultiplier: user.hasMultiplier,
        multiplierValue: user.multiplierValue,
        createdAt: user.createdAt,
      },
      gameHistory,
    });
  } catch (error) {
    console.error("Get user profile error:", error);
    res.status(500).json({
      success: false,
      error: "Server error while fetching user profile",
    });
  }
};

// Daily bonus claim
exports.claimDailyBonus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    // Check if user already claimed today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastClaim = user.lastDailyBonus || new Date(0);
    lastClaim.setHours(0, 0, 0, 0);

    if (lastClaim.getTime() === today.getTime()) {
      return res.status(400).json({
        success: false,
        error: "Daily bonus already claimed today",
      });
    }

    const bonusAmount = 25;
    await user.addEarnings(bonusAmount, true);
    user.lastDailyBonus = new Date();
    await user.save();

    res.status(200).json({
      success: true,
      message: "Daily bonus claimed successfully",
      bonusAmount,
      newBalance: user.totalEarnings,
    });
  } catch (error) {
    console.error("Daily bonus error:", error);
    res.status(500).json({
      success: false,
      error: "Server error while claiming daily bonus",
    });
  }
};

// Claim bonus (manual trigger)
exports.claimBonus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user.bonusBalance > 0) {
      return res.status(400).json({
        success: false,
        error: "Bonus already claimed",
      });
    }

    // Add welcome bonus
    const bonusAmount = 20;
    await user.addEarnings(bonusAmount, true);

    res.status(200).json({
      success: true,
      message: `₹${bonusAmount} bonus claimed successfully`,
      bonusAdded: bonusAmount,
      newBalance: user.totalEarnings,
    });
  } catch (error) {
    console.error("Claim bonus error:", error);
    res.status(500).json({
      success: false,
      error: "Server error while claiming bonus",
    });
  }
};
