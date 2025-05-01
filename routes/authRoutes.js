const express = require("express");
const router = express.Router();

const User = require("../models/User");
const {
  showLogin,
  login,
  showRegister,
  verifyRegister,
  register,
  showForgotPassword,
  sendPasswordResetOTP,
  verifyReset,
  resetPassword,
  logout,
} = require("../controllers/authController");

router.route("/login").get(showLogin).post(login);

router.route("/register").get(showRegister).post(register);

router
  .route("/forgot-password")
  .get(showForgotPassword)
  .post(sendPasswordResetOTP);

router.post("/verify-reset", verifyReset);

router.post("/reset-password", resetPassword);

router.post("/verify", verifyRegister);

router.post("/logout", logout);

module.exports = router;
