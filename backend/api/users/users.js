const express = require("express");
const db = require("../../postgres-config");
const router = express.Router();

router.get("/", async (req, res) => {
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

router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.pool.query("SELECT * FROM users WHERE user_id = $1", [
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

module.exports = router;