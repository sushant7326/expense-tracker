const express      = require('express');
const router       = express.Router();
const authenticateToken = require('../auth/authenticateToken');
const db = require("../../postgres-config");

module.exports = router;
