const express = require("express");
const router = express.Router();

const { showChatroom } = require("../controllers/chatController");

router.get("/", showChatroom);

module.exports = router;
