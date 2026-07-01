const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
require("dotenv").config({ path: "../.env" });

const userRoutes = require("./api/users/users");
const authRoutes = require("./api/auth/auth");
const transactionRoutes = require("./api/transactions/transactions");
const aiInsightRoutes = require("./api/reports/aiInsights");
const analyticsRoutes = require("./api/reports/analytics");

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
app.use("/transactions", transactionRoutes);
app.use("/insights", aiInsightRoutes);
app.use("/analytics", analyticsRoutes);

app.get("/", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Server is running!"
  })
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