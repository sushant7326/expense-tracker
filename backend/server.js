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

const saltRounds = 10;
app.post("/adduser", async (req, res) => {
  const { username, password } = req.body;
  console.log(username, password);

  try {
    const password_hash = await bcrypt.hash(password, saltRounds);
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
