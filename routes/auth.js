const express = require('express');
const { 
  sendSignupOTP, 
  verifySignupOTP, 
  sendLoginOTP, 
  verifyLoginOTP 
} = require('../controllers/authController');
const { validateSignup, validateOTP } = require('../middleware/validation');

const router = express.Router();

router.post('/signup', validateSignup, sendSignupOTP);
router.post('/verify-signup', validateOTP, verifySignupOTP);
router.post('/login', validateOTP, sendLoginOTP);
router.post('/verify-login', validateOTP, verifyLoginOTP);

module.exports = router;