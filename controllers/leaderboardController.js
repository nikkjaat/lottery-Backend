const User = require("../models/User");
const SpinHistory = require("../models/SpinHistory");

// Get top earners leaderboard
exports.getLeaderboard = async (req, res) => {
  try {
    const topEarners = await User.find({ isVerified: true })
      .select("name totalEarnings bonusBalance createdAt")
      .sort({ totalEarnings: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      leaderboard: topEarners.map((user, index) => ({
        rank: index + 1,
        name: user.name,
        totalEarnings: user.totalEarnings,
        bonusBalance: user.bonusBalance,
        joined: user.createdAt,
      })),
    });
  } catch (error) {
    console.error("Get leaderboard error:", error);
    res.status(500).json({
      success: false,
      error: "Server error while fetching leaderboard",
    });
  }
};

// Get recent winners
exports.getRecentWinners = async (req, res) => {
  try {
    const recentWinners = await SpinHistory.aggregate([
      {
        $match: {
          amountWon: { $gte: 150 }, // Only show wins of ₹150 or more
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $limit: 10,
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: "$user",
      },
      {
        $project: {
          userName: "$user.name",
          amountWon: 1,
          wasFreeSpin: 1,
          createdAt: 1,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      recentWinners,
    });
  } catch (error) {
    console.error("Get recent winners error:", error);
    res.status(500).json({
      success: false,
      error: "Server error while fetching recent winners",
    });
  }
};
