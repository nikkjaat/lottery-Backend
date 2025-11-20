const express = require("express");
const router = express.Router();
const {
  playNumberGuess,
  getGameHistory,
  getGameStats,
} = require("../controllers/numberGuessController");
const { protect } = require("../middleware/auth");

router.post("/play", protect, playNumberGuess);
router.get("/history", protect, getGameHistory);
router.get("/stats", protect, getGameStats);

module.exports = router;
