const express = require("express");
const mysql = require("mysql2/promise");
const crypto = require("crypto");
const log4js = require("log4js");

log4js.configure({
  appenders: { out: { type: "stdout" } },
  categories: { default: { appenders: ["out"], level: "info" } }
});
const logger = log4js.getLogger();
const app = express();
app.use(express.json());

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "*");
  next();
});

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: "dan",
  password: "dan123",
  database: "home-test"
});

app.post("/login", async function (req, res) {
  try {
    const email = req.body.email;
    const password = req.body.password;

    const [users] = await db.execute(
      "SELECT * FROM users WHERE email=? AND password=?",
      [email, password]
    );

    if (users.length === 0) {
      return res.status(401).send("Invalid login");
    }

    const token = crypto.randomBytes(16).toString("hex");

    await db.execute(
      "INSERT INTO user_tokens(user_id, token) VALUES(?, ?)",
      [users[0].id, token]
    );

    logger.info(JSON.stringify({
      timestamp: new Date().toISOString(),
      userId: users[0].id,
      action: "login",
      ipAddress: req.ip
    }));

    res.send(token);
  } catch (err) {
    logger.error("Login error: " + err.message);
    res.status(500).send("Database is initializing, please try again in a few seconds.");
  }
});

app.get("/profile", async function (req, res) {
  try {
    const token = req.headers["x-auth-token"];

    const [rows] = await db.execute(
      "SELECT users.id, email FROM users JOIN user_tokens ON users.id = user_tokens.user_id WHERE token = ?",
      [token]
    );

    if (rows.length === 0) {
      return res.status(401).send("Invalid token");
    }

    res.json(rows[0]);
  } catch (err) {
    logger.error("Profile error: " + err.message);
    res.status(500).send("Database error");
  }
});

app.listen(3000, function () {
  console.log("API started on port 3000");
});
