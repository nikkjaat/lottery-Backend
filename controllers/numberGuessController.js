const User = require("../models/User");
const GameHistory = require("../models/GameHistory");

// Game configurations
const GAME_MODES = {
  easy: { range: 10, payout: 8, cost: 10 },
  medium: { range: 50, payout: 25, cost: 25 },
  hard: { range: 100, payout: 50, cost: 50 }
};

// Handle number guess game
exports.playNumberGuess = async (req, res) => {
  try {
    const { mode, userGuess } = req.body;
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // Validate game mode
    const gameConfig = GAME_MODES[mode];
    if (!gameConfig) {
      return res.status(400).json({
        success: false,
        error: "Invalid game mode",
      });
    }

    // Validate user guess
    const guess = parseInt(userGuess);
    if (isNaN(guess) || guess < 1 || guess > gameConfig.range) {
      return res.status(400).json({
        success: false,
        error: `Please guess a number between 1 and ${gameConfig.range}`,
      });
    }

    // Check balance
    if (user.totalEarnings < gameConfig.cost) {
      return res.status(400).json({
        success: false,
        error: `Insufficient balance. You need at least ₹${gameConfig.cost} to play ${mode} mode.`,
      });
    }

    // Deduct game cost
    let newBalance = user.totalEarnings - gameConfig.cost;
    user.totalEarnings = newBalance;

    // Generate random number
    const randomNumber = Math.floor(Math.random() * gameConfig.range) + 1;
    
    let amountWon = 0;
    let isWinner = false;

    // Check if user won
    if (guess === randomNumber) {
      amountWon = gameConfig.cost * gameConfig.payout;
      newBalance += amountWon;
      user.totalEarnings = newBalance;
      isWinner = true;
    }

    // Update user
    user.lastPlayedAt = new Date();
    await user.save();

    // Record game history
    const gameHistory = await GameHistory.create({
      userId: user._id,
      gameType: "number_guess",
      gameMode: mode,
      userGuess: guess,
      correctNumber: randomNumber,
      amountWon: amountWon,
      gameCost: gameConfig.cost,
      isWinner: isWinner,
      finalBalance: user.totalEarnings,
    });

    console.log(
      `Number Guess: ${user.email} played ${mode} mode, guessed ${guess}, correct was ${randomNumber}, ${isWinner ? 'WON' : 'LOST'} ${amountWon}`
    );

    res.status(200).json({
      success: true,
      gameResult: {
        userGuess: guess,
        correctNumber: randomNumber,
        isWinner: isWinner,
        amountWon: amountWon,
        gameCost: gameConfig.cost,
        payoutMultiplier: gameConfig.payout,
        mode: mode
      },
      newBalance: user.totalEarnings,
      message: isWinner 
        ? `🎉 Congratulations! You won ₹${amountWon}!` 
        : `😢 Better luck next time! The number was ${randomNumber}.`
    });

  } catch (error) {
    console.error("Number guess game error:", error);
    res.status(500).json({
      success: false,
      error: "Server error while processing game",
    });
  }
};

// Get user game history
exports.getGameHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const gameHistory = await GameHistory.find({ userId, gameType: "number_guess" })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await GameHistory.countDocuments({ userId, gameType: "number_guess" });

    res.status(200).json({
      success: true,
      gameHistory,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get game history error:", error);
    res.status(500).json({
      success: false,
      error: "Server error while fetching game history",
    });
  }
};

// Get game statistics
exports.getGameStats = async (req, res) => {
  try {
    const userId = req.user._id;

    const stats = await GameHistory.aggregate([
      { $match: { userId: mongoose.Types.ObjectId(userId), gameType: "number_guess" } },
      {
        $group: {
          _id: "$gameMode",
          totalGames: { $sum: 1 },
          totalWins: { $sum: { $cond: ["$isWinner", 1, 0] } },
          totalWinnings: { $sum: "$amountWon" },
          totalCost: { $sum: "$gameCost" }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      stats
    });
  } catch (error) {
    console.error("Get game stats error:", error);
    res.status(500).json({
      success: false,
      error: "Server error while fetching game statistics",
    });
  }
};