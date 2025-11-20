const mongoose = require("mongoose");

const spinHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  amountWon: {
    type: Number,
    required: true,
    default: 0,
  },
  rewardType: {
    type: String,
    required: true,
    enum: ["Better luck next time", "₹10", "₹50", "2X"],
  },
  wasFreeSpin: {
    type: Boolean,
    default: false,
  },
  spinCost: {
    type: Number,
    default: 0,
  },
  finalBalance: {
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("SpinHistory", spinHistorySchema);
