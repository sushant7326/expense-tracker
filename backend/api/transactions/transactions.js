const express = require("express");
const db = require("../../postgres-config.js");
const router = express.Router();

const authenticateToken = require("../auth/authenticateToken");

router.get("/", authenticateToken, async (req, res) => {
  const user_id = req.user_id;
  try {
    const result = await db.pool.query("SELECT * FROM transactions WHERE user_id = $1", [
      user_id,
    ]);
    res.status(200).json({status: "success", message: result.rows});
  } catch (error) {
    console.error("Error making database query");
    res.status(500).json({ error: "Error making database query" });
  }
});

router.get("/expense", authenticateToken, async(req, res) =>{
  const user_id = req.user_id;
  try {
    const result = await db.pool.query("SELECT * FROM transactions WHERE user_id = $1 and expense = true", [user_id]);
    res.status(200).json({
      status: "success",
      message: result.rows
    });
  } catch (error) {
    console.error("Error making database call");
    res.status(500).json({error: "Error making database call"});
  }
} );

router.get("/income", authenticateToken, async(req, res) =>{
  const user_id = req.user_id;
  try {
    const result = await db.pool.query("SELECT * FROM transactions WHERE user_id = $1 and expense = false", [user_id]);
    res.status(200).json({
      status: "success",
      message: result.rows
    });
  } catch (error) {
    console.error("Error making database call");
    res.status(500).json({error: "Error making database call"});
  }
} );

router.post("/add", authenticateToken, async (req, res) => {
  const user_id = req.user_id;
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
});

router.put("/update-transaction/:id", authenticateToken, async (req, res) => {
  const { id: transaction_id } = req.params;
  const user_id = req.user_id;
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
    const result = await db.pool.query(
      `UPDATE transactions
       SET amount = $1, expense = $2, title = $3, description = $4,
           category = $5, payment_method = $6, location = $7,
           updated_at = CURRENT_TIMESTAMP
       WHERE transaction_id = $8 AND user_id = $9
       RETURNING *`,
      [amount, expense, title, description, category, payment_method, location, transaction_id, user_id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: "Transaction not found or not authorised." });
    res.status(200).json({ status: "success", message: "Transaction updated successfully" });
  } catch (error) {
    console.error("Error making database query", error.message);
    res.status(500).json({ error: "Error making database query" });
  }
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
