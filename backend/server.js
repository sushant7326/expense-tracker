const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const bcrypt = require("bcrypt");
require("dotenv").config({ path: "../.env" });

const db = require("./postgres-config");
const app = express();
const PORT = process.env.BE_PORT;

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type"],
  })
);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.post("/adduser", async (req, res) => {
  const { username, password } = req.body;
  console.log(username, password);

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
        return res.status(409).json({ error: "User already exists" });
      console.error("Error creating user: ", error.message);
      res.status(500).json({ error: "Failed to create user" });
    }
  } catch (error) {
    console.error("Error hashing password: ", error.message);
    res.status(500).json({ error: "Failed to hash password" });
  }
});

app.get("/listusers", async (req, res) => {
  try {
    const result = await db.pool.query("SELECT * FROM users");
    res.status(200).json({
      status: "success",
      data: result.rows,
    });
  } catch (error) {
    console.error("Error listing users: ", error.message);
    res.status(500).json({ error: "Failed to list users" });
  }
});

app.get("/listuser/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.pool.query("SELECT * FROM users WHERE id = $1", [
      id,
    ]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(200).json({
      status: "success",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error listing user: ", error.message);
    res.status(500).json({ error: "Failed to list user" });
  }
});

app.put("/updatepassword/:id", async (req, res) => {
  const { id } = req.params;
  const { password } = req.body;
  try {
    const password_hash = await bcrypt.hash(
      password,
      parseInt(process.env.SALT_ROUNDS)
    );
    try {
      const result = await db.pool.query(
        "UPDATE users SET password_hash = $1 WHERE id = $2 RETURNING *",
        [password_hash, id]
      );
      res.status(200).json({
        status: "success",
        data: result.rows[0],
      });
    } catch (error) {
      console.error("Error updating password: ", error.message);
      res.status(500).json({ error: "Failed to update password" });
    }
  } catch (error) {
    console.error("Error hashing password: ", error.message);
    res.status(500).json({ error: "Failed to hash password" });
  }
});

app.delete("/deleteuser/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const entry = await db.pool.query("SELECT * FROM users WHERE id = $1;", [
      id,
    ]);
    if (entry.rows.length === 0)
      return res.status(404).json({ error: "User not found" });
    try {
      const result = await db.pool.query("DELETE FROM users WHERE id = $1", [
        id,
      ]);
      if (result.rowCount === 0) {
        return res.status(404).json({ error: "User not found" });
      }
      res.status(200).json({
        status: "success",
        message: "User deleted successfully",
        user: entry.rows[0],
      });
    } catch (error) {
      console.error("Error deleting user: ", error.message);
      res.status(500).json({ error: "Failed to delete user" });
    }
  } catch (error) {
    console.error("User not found: ", error.message);
    res.status(500).json({ error: "User not found" });
  }
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  console.log(req.params);
  res.status(500).json({
    status: "error",
    message: "Something went wrong!!!!",
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// i want to build an expense tracker application using express js and postgresql
// i have created a database with 2 tables
// one to list all the users and another to list all the expenses (for all users in one table, each entry contains a userid column, which references unique userid in the first table)

// now, how do i go about
