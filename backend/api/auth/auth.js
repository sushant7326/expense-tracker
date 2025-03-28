const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();

const db = require("../../postgres-config");
require("dotenv").config();

// const jwt = require("jsonwebtoken");
// const JWT_SECRET = process.env.JWT_SECRET;
const SALT_ROUNDS = process.env.SALT_ROUNDS;

router.post("/register", async (req, res) => {
  const { username, password } = req.body;

  try {
    const password_hash = await bcrypt.hash(
      password,
      parseInt(process.env.SALT_ROUNDS)
    );
    try {
      const result = await db.pool.query(
        "INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING *",
        [username, password_hash]
      );
      res.status(201).json({
        status: "success",
        data: result.rows[0],
      });
    } catch (error) {
      if (error.code === "23505")
        return res.status(400).json({ error: "User already exists" });
      console.error("Error creating user: ", error.message);
      res.status(500).json({ error: "Failed to create user" });
    }
  } catch (error) {
    console.error("Error hashing password: ", error.message);
    res.status(500).json({ error: "Failed to hash password" });
  }
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await db.pool.query(
      "SELECT * FROM users WHERE username = $1",
      [username]
    );
    if (user.rows.lenght === 0)
      return res.status(401).json({ error: "Invalid username" });
    try {
      const is_valid = await bcrypt.compare(
        password,
        user.rows[0].password_hash
      );
      if (!is_valid)
        return res.status(401).json({ error: "Invalid username or password!" });

      res.status(200).json({
        status: "sucess",
        message: "Logged in successfully",
      });
    } catch (error) {
      console.error("Error in comparing hashed password", error.message);
      res.status(500).json({ error: "Error in comparing hashed password" });
    }
  } catch (error) {
    console.error("Error in query fiding user: ", error.message);
    res.status(500).json({ error: "Error running in psql query" });
  }
});

module.exports = router;
