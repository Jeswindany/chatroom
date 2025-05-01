const bcrypt = require("bcrypt");

const catchAsync = require("../utils/catchAsync");
const User = require("../models/User");

const generateOTP = require("../utils/generateOTP");
const sendOTP = require("../utils/sendOTP");

const showLogin = (req, res) => {
  if (req.session.currentUser) {
    req.flash("success", "You are already logged in!");
    return res.redirect("/chatroom");
  }
  res.render("login.ejs");
};

const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email: email.trim().toLowerCase() });

    if (!user) {
      req.flash("error", "No user found with that email");
      return res.redirect("/login");
    }

    const isValid = await user.validPassword(password);
    if (!isValid) {
      req.flash("error", "Incorrect password");
      return res.redirect("/login");
    }

    req.session.currentUser = {
      id: user._id,
      displayName: user.displayName,
    };

    res.redirect("/chatroom");
  } catch (err) {
    console.error(err);
    req.flash("error", "Something went wrong, try again later");
    res.redirect("/login");
  }
});

const showRegister = (req, res) => {
  if (req.session.currentUser) {
    req.flash("success", "You are already logged in!");
    return res.redirect("/chatroom");
  }
  res.render("register.ejs");
};

const register = catchAsync(async (req, res) => {
  const { email: toEmail } = req.body;
  const existingUser = await User.findOne({
    email: toEmail.trim().toLowerCase(),
  });

  if (existingUser) {
    req.flash("error", "Email is already registered");
    return res.redirect("/login");
  }

  const otp = generateOTP();

  const pendingUser = {
    displayName: req.body.displayName.trim(),
    email: toEmail.trim().toLowerCase(),
    password: req.body.password,
  };
  req.session.pendingUser = pendingUser;

  req.session.otp = otp;

  await sendOTP(toEmail, otp);

  res.render("verify", { ...req.body });
});

const showForgotPassword = (req, res) => {
  res.render("forgot-password");
};

const sendPasswordResetOTP = catchAsync(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email: email.trim().toLowerCase() });

  if (!user) {
    req.flash("error", "No account with that email.");
    return res.redirect("/login");
  }

  const otp = generateOTP();
  req.session.resetEmail = email;
  req.session.resetOTP = otp;
  await sendOTP(email, otp);

  res.render("verify-reset", { email });
});

const verifyReset = catchAsync(async (req, res) => {
  if (req.body.otp !== req.session.resetOTP) {
    req.flash("error", "Incorrect OTP.");
    return res.redirect("/forgot-password");
  }
  res.render("reset-password");
});

const resetPassword = catchAsync(async (req, res) => {
  const email = req.session.resetEmail;
  const newPassword = await bcrypt.hash(req.body.password, 12);
  await User.findOneAndUpdate({ email }, { password: newPassword });

  delete req.session.resetOTP;
  delete req.session.resetEmail;

  req.flash("success", "Password reset successfully!");
  res.redirect("/login");
});

const verifyRegister = async (req, res) => {
  if (!req.session.pendingUser || !req.session.otp) {
    req.flash("error", "Session expired. Please register again.");
    return res.redirect("/register");
  }

  const { displayName, email, password } = req.session.pendingUser;

  if (req.body.otp === req.session.otp) {
    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = await User.create({
      displayName: displayName.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
    });

    req.session.currentUser = {
      id: newUser._id,
      displayName: newUser.displayName,
    };

    delete req.session.otp;
    delete req.session.pendingUser;

    res.redirect("/chatroom");
  } else {
    req.flash("error", "Incorrect OTP");
    return res.redirect("/register");
  }
};

const logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
};

module.exports = {
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
};
