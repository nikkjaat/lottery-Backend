const mongoose = require("mongoose");

const gameHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  gameType: {
    type: String,
    required: true,
    enum: ["number_guess", "spin_wheel"],
  },
  gameMode: {
    type: String,
    enum: ["easy", "medium", "hard"],
  },
  userGuess: {
    type: Number,
  },
  correctNumber: {
    type: Number,
  },
  amountWon: {
    type: Number,
    default: 0,
  },
  gameCost: {
    type: Number,
    default: 0,
  },
  isWinner: {
    type: Boolean,
    default: false,
  },
  finalBalance: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("GameHistory", gameHistorySchema);
