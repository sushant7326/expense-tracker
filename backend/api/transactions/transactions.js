const express = require("express");
const db = require("../../postgres-config.js");
const router = express.Router();

const authenticateToken = require("../auth/authenticateToken");

router.post("/add", authenticateToken, async (req, res) => {
  const user_id = req.user_id;
  console.log(user_id);
  const {
    amount,
    expense,
    title,
    description,
    category,
    payment_method,
    location,
  } = req.body;
  try {
    await db.pool.query(
      "INSERT INTO transactions (user_id, amount, expense, title, description, category, payment_method, location) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *",
      [
        user_id,
        amount,
        expense,
        title,
        description,
        category,
        payment_method,
        location,
      ]
    );
    res
      .status(200)
      .json({ status: "success", message: "Transaction added successfully" });
  } catch (error) {
    console.error("Error making database query");
    res.status(500).json({ error: "Error making database query" });
  }
  res.status(200).json({
    status: "success",
    message: "successfully accessed request body contents",
  });
});

router.delete("/delete", authenticateToken, async (req, res) => {
  const { transaction_id } = req.body;
  try {
    await db.pool.query("DELETE FROM transactions WHERE transaction_id = $1", [
      transaction_id,
    ]);
    res
      .status(200)
      .json({ status: "success", message: "Transaction deleted successfully" });
  } catch (error) {
    console.log("Error making database query");
    res.status(500).json({ error: "Error making database query" });
  }
});

module.exports = router;
