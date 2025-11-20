const User = require("../models/User");
const SpinHistory = require("../models/SpinHistory");

// Available rewards - MUST MATCH FRONTEND EXACTLY
const REWARDS = ["Better luck next time", "₹10", "₹50", "2X"];

// Get random reward with exact probabilities
const getRandomReward = () => {
  const random = Math.random();

  // Probability distribution matching frontend
  if (random < 0.3) return "Better luck next time"; // 30% chance
  if (random < 0.7) return "₹10"; // 40% chance (30% + 40%)
  if (random < 0.95) return "₹50"; // 25% chance (70% + 25%)
  return "2X"; // 5% chance (95% + 5%)
};

// Handle spin
exports.spinWheel = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    const isFreeSpin = user.hasFreeSpin;
    const spinCost = 50;

    // Check if user has sufficient balance for paid spin
    if (!isFreeSpin && user.totalEarnings < spinCost) {
      return res.status(400).json({
        success: false,
        error: "Insufficient balance. You need at least ₹50 to spin.",
      });
    }

    // DEDUCT SPIN COST FIRST (only for paid spins)
    let newBalance = user.totalEarnings;
    if (!isFreeSpin) {
      newBalance -= spinCost;
      user.totalEarnings = newBalance;
    }

    // Get random reward
    const rewardResult = getRandomReward();
    console.log(`Spin result: ${rewardResult} for user ${user.email}`);

    let amountWon = 0;
    let hasMultiplier = false;

    // Handle different reward types
    if (rewardResult === "2X") {
      // Store multiplier for next spin
      user.hasMultiplier = true;
      user.multiplierValue = 2;
      hasMultiplier = true;
      amountWon = 0;

      // No additional balance changes for 2X (only spin cost was deducted)
    } else if (rewardResult === "Better luck next time") {
      // Better luck next time - no winnings
      amountWon = 0;
      // Only spin cost was deducted, no winnings added
    } else {
      // Regular cash prize (₹10 or ₹50)
      const cashAmount = parseInt(rewardResult.replace("₹", ""));
      amountWon = cashAmount;

      // Apply multiplier if active from previous spin
      if (user.hasMultiplier && user.multiplierValue > 1) {
        amountWon = cashAmount * user.multiplierValue;
        console.log(`Multiplier applied: ${cashAmount} -> ${amountWon}`);

        // Reset multiplier after use
        user.hasMultiplier = false;
        user.multiplierValue = 1;
      }

      // Add winnings to balance
      newBalance += amountWon;
      user.totalEarnings = newBalance;
    }

    // Update free spin status
    if (user.hasFreeSpin) {
      user.hasFreeSpin = false;
    }

    user.lastSpinAt = new Date();
    await user.save();

    // Record spin history
    const spinHistory = await SpinHistory.create({
      userId: user._id,
      amountWon: amountWon,
      wasFreeSpin: isFreeSpin,
      rewardType: rewardResult,
      spinCost: isFreeSpin ? 0 : spinCost,
      finalBalance: user.totalEarnings,
    });

    // Find the exact segment index for frontend
    const segmentIndex = REWARDS.findIndex((reward) => reward === rewardResult);

    console.log(
      `Spin result for ${user.email}: ${rewardResult} (index: ${segmentIndex}), Amount Won: ${amountWon}, New Balance: ${user.totalEarnings}`
    );

    res.status(200).json({
      success: true,
      rewardResult,
      segmentIndex,
      amountWon,
      wasFreeSpin: isFreeSpin,
      newBalance: user.totalEarnings,
      spinCost: isFreeSpin ? 0 : spinCost,
      hasMultiplier: hasMultiplier,
      multiplierActive: user.hasMultiplier && user.multiplierValue > 1,
      multiplierValue: user.multiplierValue || 1,
    });
  } catch (error) {
    console.error("Spin wheel error:", error);
    res.status(500).json({
      success: false,
      error: "Server error while processing spin",
    });
  }
};

// Get user spin history
exports.getSpinHistory = async (req, res) => {
  try {
    const userId = req.user._id;

    const spinHistory = await SpinHistory.find({ userId })
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json({
      success: true,
      spinHistory,
    });
  } catch (error) {
    console.error("Get spin history error:", error);
    res.status(500).json({
      success: false,
      error: "Server error while fetching spin history",
    });
  }
};

// Get user spin history
exports.getSpinHistory = async (req, res) => {
  try {
    const userId = req.user._id;

    const spinHistory = await SpinHistory.find({ userId })
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json({
      success: true,
      spinHistory,
    });
  } catch (error) {
    console.error("Get spin history error:", error);
    res.status(500).json({
      success: false,
      error: "Server error while fetching spin history",
    });
  }
};
