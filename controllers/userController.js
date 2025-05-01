const catchAsync = require("../utils/catchAsync");
const User = require("../models/User");

const showProfile = catchAsync(async (req, res) => {
  if (req.session.currentUser) {
    const user = await User.findById(req.session.currentUser.id);
    return res.render("profile", { user });
  } else {
    req.flash("error", "Please login before entering profile!");
    res.redirect("login");
  }
});

const changeDisplayName = catchAsync(async (req, res) => {
  if (!req.session.currentUser) {
    req.flash("error", "Session expired! Please login again");
    return res.redirect("login");
  }

  const { displayName } = req.body;
  await User.findByIdAndUpdate(req.session.currentUser.id, {
    displayName,
  });

  req.flash(
    "success",
    "Name change successful! It will take effect from your next login!"
  );
  res.redirect("/chatroom");
});

module.exports = { showProfile, changeDisplayName };
