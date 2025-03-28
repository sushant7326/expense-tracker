const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const bcrypt = require("bcrypt");
require("dotenv").config({ path: "../.env" });

const userRoutes = require("./api/users/users");
const authRoutes = require("./api/auth/auth");
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

app.use("/users", userRoutes);
app.use("/auth", authRoutes);

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