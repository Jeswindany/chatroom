const express = require('express');
const path = require('path');
const ejsMate = require('ejs-mate');
const session = require("express-session");

const app = express();
const server = require("http").createServer(app);

app.use(express.static(path.join(__dirname, "public")));

app.set('view engine', 'ejs');
app.engine('ejs', ejsMate);
app.set('views', path.join(__dirname, 'views'));

app.get('/', (req, res) => {
    res.render('index.ejs');
})

app.get('/login', (req, res) => {
    res.render('login.ejs');
})

app.get('/register', (req, res) => {
    res.render('register.ejs');
})

server.listen(5000, () => {
    console.log("Server running at port 5000");
})