const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
require("dotenv").config({ path: "../.env" });

const userRoutes = require("./api/users/users");
const authRoutes = require("./api/auth/auth");
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