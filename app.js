require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const socketIo = require("socket.io");
const flash = require("connect-flash");
const MongoStore = require("connect-mongo");
const nodemailer = require("nodemailer");
const { setupSocket } = require("./utils/socket");

const app = express();
const server = require("http").createServer(app);
const io = socketIo(server);

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    console.log("Database connected");
  })
  .catch((err) => {
    console.error("Database connection error:", err);
  });

setupSocket(io);

app.use(
  session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
    // store: MongoStore.create({
    //   mongoUrl: process.env.MONGO_URL,
    //   collectionName: "sessions",
    // }),
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

// Routes
const authRoutes = require("./routes/authRoutes");
const chatRoutes = require("./routes/chatRoutes");
const userRoutes = require("./routes/userRoutes");

app.get("/", (req, res) => {
  res.render("index.ejs");
});

app.use("/", authRoutes);
app.use("/chatroom", chatRoutes);
app.use("/profile", userRoutes);

// Error Handling
app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.render("error", { err });
});

server.listen(process.env.PORT || 3000, () => {
  console.log("Server running at port 3000");
});
