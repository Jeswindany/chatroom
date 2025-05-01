const express = require("express");
const router = express.Router();

const User = require("../models/User");
const {
  showProfile,
  changeDisplayName,
} = require("../controllers/userController");

router.route("/").get(showProfile).post(changeDisplayName);

module.exports = router;
