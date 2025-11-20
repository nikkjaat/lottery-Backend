const express = require("express");
const { spinWheel, getSpinHistory } = require("../controllers/spinController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.use(protect); // All routes below are protected

router.post("/spin", spinWheel);
router.get("/spin-history", getSpinHistory);

module.exports = router;
