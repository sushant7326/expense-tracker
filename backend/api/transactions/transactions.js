const express = require("express");
const db = require("../../postgres-config.js");
const router = express.Router();

const authenticateToken = require("../auth/authenticateToken");
const { user } = require("pg/lib/defaults.js");

router.get("/", authenticateToken, async (req, res) => {
  const user_id = req.user_id;
  const { categoryId, paymentMethodId, startDate, endDate } = req.query;
  
  const page = parseInt(req.query.page, 10) || 1;

  try {
    let sql = `
      SELECT t.transaction_id, t.amount, t.title, c.name AS category_name, p.name as payment_method
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.category_id
      LEFT JOIN paymentMethods p ON t.payment_method_id = p.method_id
      WHERE t.user_id = $1
    `;
    const params = [user_id];

    if (categoryId) {
      params.push(categoryId);
      sql += ` AND t.category_id = $${params.length}`;
    }

    if (paymentMethodId) {
      params.push(paymentMethodId);
      sql += ` AND t.payment_method_id = $${params.length}`;
    }

    if (startDate) {
      params.push(startDate);
      sql += ` AND t.transaction_time >= $${params.length}`;
    }

    if (endDate) {
      params.push(`${endDate} 23:59:59`);
      sql += ` AND t.transaction_time <= $${params.length}`;
    }

    const limit = 20;
    const offset = (page - 1) * limit;

    sql += ` ORDER BY t.transaction_time DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await db.pool.query(sql, params);
    
    res.status(200).json({ status: "success", data: result.rows });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Database error" });
  }
});

router.get("/expense", authenticateToken, async(req, res) =>{
  const user_id = req.user_id;
  const { categoryId, paymentMethodId, startDate, endDate } = req.query;
  
  const page = parseInt(req.query.page, 10) || 1;

  try {
    let sql = `
      SELECT t.transaction_id, t.amount, t.title, c.name AS category_name, p.name as payment_method
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.category_id
      LEFT JOIN paymentMethods p ON t.payment_method_id = p.method_id
      WHERE t.user_id = $1 and t.expense = true
    `;
    const params = [user_id];

    if (categoryId) {
      params.push(categoryId);
      sql += ` AND t.category_id = $${params.length}`;
    }

    if (paymentMethodId) {
      params.push(paymentMethodId);
      sql += ` AND t.payment_method_id = $${params.length}`;
    }

    if (startDate) {
      params.push(startDate);
      sql += ` AND t.transaction_time >= $${params.length}`;
    }

    if (endDate) {
      params.push(`${endDate} 23:59:59`);
      sql += ` AND t.transaction_time <= $${params.length}`;
    }

    const limit = 20;
    const offset = (page - 1) * limit;

    sql += ` ORDER BY t.transaction_time DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await db.pool.query(sql, params);
    
    res.status(200).json({ status: "success", data: result.rows });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Database error" });
  }
});

router.get("/income", authenticateToken, async(req, res) =>{
  const user_id = req.user_id;
  const { categoryId, paymentMethodId, startDate, endDate } = req.query;
  
  const page = parseInt(req.query.page, 10) || 1;

  try {
    let sql = `
      SELECT t.transaction_id, t.amount, t.title, c.name AS category_name, p.name as payment_method
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.category_id
      LEFT JOIN paymentMethods p ON t.payment_method_id = p.method_id
      WHERE t.user_id = $1 and t.expense = false
    `;
    const params = [user_id];

    if (categoryId) {
      params.push(categoryId);
      sql += ` AND t.category_id = $${params.length}`;
    }

    if (paymentMethodId) {
      params.push(paymentMethodId);
      sql += ` AND t.payment_method_id = $${params.length}`;
    }

    if (startDate) {
      params.push(startDate);
      sql += ` AND t.transaction_time >= $${params.length}`;
    }

    if (endDate) {
      params.push(`${endDate} 23:59:59`);
      sql += ` AND t.transaction_time <= $${params.length}`;
    }

    const limit = 20;
    const offset = (page - 1) * limit;

    sql += ` ORDER BY t.transaction_time DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await db.pool.query(sql, params);
    
    res.status(200).json({ status: "success", data: result.rows });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Database error" });
  }
});

router.post("/add", authenticateToken, async (req, res) => {
  const user_id = req.user_id;
  const { amount, expense, title, description, category_id, payment_method_id, location } = req.body;

  try {
    const categoryCheck = await db.pool.query(
      `SELECT category_id FROM categories 
       WHERE category_id = $1 AND (user_id = $2 OR user_id IS NULL)`,
      [category_id, user_id]
    );

    if (categoryCheck.rowCount === 0) {
      return res.status(403).json({ 
        error: "Unauthorized", 
        message: "Invalid category or you do not have permission to use it." 
      });
    }

    const paymentCheck = await db.pool.query(
      `SELECT method_id FROM paymentMethods 
       WHERE method_id = $1 AND (user_id = $2 OR user_id IS NULL)`,
      [payment_method_id, user_id]
    );

    if (paymentCheck.rowCount === 0) {
      return res.status(403).json({ 
        error: "Unauthorized", 
        message: "Invalid payment method or you do not have permission to use it." 
      });
    }

    const result = await db.pool.query(
      `INSERT INTO transactions 
       (user_id, amount, expense, title, description, category_id, payment_method_id, location) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [user_id, amount, expense, title, description, category_id, payment_method_id, location]
    );

    res.status(201).json({ 
      status: "success", 
      message: "Transaction added successfully", 
      transaction: result.rows[0] 
    });

  } catch (error) {
    console.error("Error adding transaction:", error);
    res.status(500).json({ error: "Error making database query" });
  }
});

router.put("/update-transaction/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const user_id = req.user_id;

  const { amount, expense, title, description, category_id, payment_method_id, location } = req.body;

  try {
    const categoryCheck = await db.pool.query(
      `SELECT category_id FROM categories 
       WHERE category_id = $1 AND (user_id = $2 OR user_id IS NULL)`,
      [category_id, user_id]
    );

    if (categoryCheck.rowCount === 0) {
      return res.status(403).json({ 
        error: "Unauthorized", 
        message: "Invalid category or you do not have permission to use it." 
      });
    }

    const paymentCheck = await db.pool.query(
      `SELECT method_id FROM paymentMethods 
       WHERE method_id = $1 AND (user_id = $2 OR user_id IS NULL)`,
      [payment_method_id, user_id]
    );

    if (paymentCheck.rowCount === 0) {
      return res.status(403).json({ 
        error: "Unauthorized", 
        message: "Invalid payment method or you do not have permission to use it." 
      });
    }

    const result = await db.pool.query(
      `UPDATE transactions
       SET amount = $1, expense = $2, title = $3, description = $4, category_id = $5, payment_method_id = $6, location = $7
       WHERE transaction_id = $8 AND user_id = $9
       RETURNING *`,
      [amount, expense, title, description, category_id, payment_method_id, location, id, user_id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Transaction not found or unauthorized" });
    }

    res.status(200).json({
      status: "success",
      message: "Transaction updated successfully",
      transaction: result.rows[0],
    });
  } catch (error) {
    console.error("Error updating transaction:", error);
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

router.post("/addLookups", authenticateToken, async(req, res) => {
  const { field } = req.query;
  const { name } = req.body;
  const user_id = req.user_id;

  const allowedFields = {
    category: {
      tableName: "categories",
      idColumn: "category_id"
    }, 
    paymentMethod: {
      tableName: "paymentmethods",
      idColumn: "method_id"
    }
  }

  const targetConfig = allowedFields[field];
  if (!targetConfig) {
    return res.status(400).json({
      error: "Invalid field parameter. Must be 'category' or 'paymentMethod'."
    });
  }
  
  if (!name || typeof name !== "string" || name.trim() === "") {
    return res.status(400).json({ 
      error: "A valid name is required." 
    });
  }

  try {
    const query = `
      INSERT INTO "${targetConfig.tableName}" (user_id, name)
      VALUES ($1, $2)
      RETURNING ${targetConfig.idColumn} AS id, name
    `;

    const result = await db.pool.query(query, [user_id, name.trim()]);
    res.status(201).json({
      status: "success",
      message: `${field} added successfully.`,
      data: result.rows[0]
    });
  } catch(error) {

    if (error.code === '23505') {
      return res.status(409).json({
        error: "Duplicate Entry",
        message: `You already have a ${field} named '${name.trim()}'.`
      });
    }

    console.error(`Error adding lookup for ${field}:`, error);
    res.status(500).json({ error: "Error making database query" });
  }

});

module.exports = router;