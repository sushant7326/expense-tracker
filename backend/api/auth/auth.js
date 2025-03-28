const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();

const db = require("../../postgres-config");
require("dotenv").config();

const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;
const authenticateToken = require("./authenticateToken");

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
      console.log("before jwt creation code");
      const token = jwt.sign(
        {
          user_id: user.rows[0].user_id,
        },
        JWT_SECRET,
        {
          expiresIn: "1h",
        }
      );
      res.json({ token, user_id: user.rows[0].user_id });
    } catch (error) {
      console.error("Error in comparing hashed password", error.message);
      res.status(500).json({ error: "Error in comparing hashed password" });
    }
  } catch (error) {
    console.error("Error in query fiding user: ", error.message);
    res.status(500).json({ error: "Error running in psql query" });
  }
});

router.put("/change-password", authenticateToken, async (req, res) => {
  const { new_password } = req.body;
  try {
    const new_password_hashed = await bcrypt.hash(
      new_password,
      parseInt(process.env.SALT_ROUNDS)
    );
    try {
      await db.pool.query(
        "UPDATE users SET password_hash = $1 WHERE user_id = $2",
        [new_password_hashed, req.user_id]
      );
      res.json({
        status: "success",
        message: "Password updated successfully",
      });
    } catch (error) {
      console.error("Error updating password into database");
      res.status(500).json({ error: "Error updating password to database" });
    }
  } catch (error) {
    console.error("Error hashing new password", error.message);
    res.status(500).json({ error: "Error hashing new password" });
  }
});

router.delete("/delete-user", authenticateToken, async (req, res) => {
  const { password } = req.body;
  const user_id = req.user_id;
  console.log(user_id);
  try {
    const response = await db.pool.query(
      "SELECT password_hash FROM users WHERE user_id = $1",
      [user_id]
    );
    const hashed_password = response.rows[0].password_hash;
    try {
      const is_valid = await bcrypt.compare(password, hashed_password);
      if (!is_valid) return res.status(401).json({ error: "Invalid Password" });
      try {
        await db.pool.query(
          "DELETE FROM users WHERE user_id = $1",
          [user_id]
        );
        return res.status(200).json({
          status: "success",
          message: `User ${user_id} deleted successfully`,
        });
      } catch (error) {
        console.error("Error deleting user row from databsae");
        res.status(500).json("Error deleting user row from database");
      }
    } catch (error) {
      console.error("Error comparing password with database entry");
      res
        .status(500)
        .json({ error: "Error comparing password with database entry" });
    }
  } catch (error) {
    console.error("Error fetching password from database");
    res
      .status(500)
      .json({ error: "Error fetching password from database" });
  }
});

module.exports = router;
