require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const socketIo = require("socket.io");
const bcrypt = require("bcrypt");
const flash = require("connect-flash");

const User = require("./models/User");
const generateOTP = require("./utils/generateOTP");
const sendOTP = require("./utils/sendOTP");
const catchAsync = require("./utils/catchAsync");

const app = express();
const server = require("http").createServer(app);
const io = socketIo(server);

const nodemailer = require("nodemailer");

mongoose.connect(process.env.MONGO_URL);

app.use(
  session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  })
);

app.use(flash());

app.use((req, res, next) => {
  res.locals.success_msg = req.flash("success");
  res.locals.error_msg = req.flash("error");
  next();
});

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.set("view engine", "ejs");
app.engine("ejs", ejsMate);
app.set("views", path.join(__dirname, "views"));

app.get("/", (req, res) => {
  res.render("index.ejs");
});

app
  .route("/login")
  .get((req, res) => {
    res.render("login.ejs");
  })
  .post(async (req, res) => {
    const { email, password } = req.body;

    try {
      const user = await User.findOne({ email });

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

app
  .route("/register")
  .get((req, res) => {
    res.render("register.ejs");
  })
  .post(
    catchAsync(async (req, res) => {
      const { email: toEmail } = req.body;
      const existingUser = await User.findOne({ email: toEmail });

      if (existingUser) {
        req.flash("error", "Email is already registered");
        return res.redirect("/login");
      }

      const otp = generateOTP();
      req.session.pendingUser = req.body;
      req.session.otp = otp;

      await sendOTP(toEmail, otp);

      res.render("verify", { ...req.body });
    })
  );

app.post("/verify", async (req, res) => {
  const { displayName, email, password } = req.session.pendingUser;

  if (req.body.otp === req.session.otp) {
    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = await User.create({
      displayName,
      email,
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
});

app.get("/chatroom", (req, res) => {
  if (req.session.currentUser) {
    res.render("chatroom", { currentUser: req.session.currentUser });
  } else {
    req.flash("error", "Please login before entering chatroom!");
    res.redirect("/login");
  }
});

app.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
});

io.on("connection", (socket) => {
  // Handle user join event
  socket.on("user-joined", (displayName) => {
    console.log(`${displayName} has joined the chat`);
    io.emit("user-joined", `${displayName} has joined the chat`);
  });

  // Handle user message event
  socket.on("send-message", (message) => {
    io.emit("chat-message", { message });
  });

  // Handle user disconnect event
  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});

// Error Handling
app.use((err, req, res, next) => {
  res.render("error", { err });
});

server.listen(3000, () => {
  console.log("Server running at port 3000");
});
