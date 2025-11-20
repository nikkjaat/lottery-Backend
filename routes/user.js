const express = require("express");
const {
  getUserProfile,
  claimBonus,
  claimDailyBonus,
} = require("../controllers/userController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.use(protect); // All routes below are protected

router.get("/profile", getUserProfile);
router.post("/claim-bonus", claimBonus);
router.post("/daily-bonus", claimDailyBonus);

module.exports = router;
