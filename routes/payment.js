const express = require("express");
const {
  createOrder,
  verifyPayment,
  getPaymentHistory,
} = require("../controllers/paymentController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.use(protect); // All routes below are protected

router.post("/create-order", createOrder);
router.post("/verify-payment", verifyPayment);
router.get("/payment-history", getPaymentHistory);

module.exports = router;
