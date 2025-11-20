const express = require("express");
const {
  requestWithdrawal,
  getWithdrawalHistory,
  getWithdrawalRequests,
} = require("../controllers/withdrawalController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.use(protect); // All routes below are protected

router.post("/request", requestWithdrawal);
router.get("/history", getWithdrawalHistory);
router.get("/requests", getWithdrawalRequests);

module.exports = router;
