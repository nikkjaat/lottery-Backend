const express = require("express");
const {
  getLeaderboard,
  getRecentWinners,
} = require("../controllers/leaderboardController");

const router = express.Router();

router.get("/leaderboard", getLeaderboard);
router.get("/recent-winners", getRecentWinners);

module.exports = router;
