const Pool = require('pg').Pool;
require('dotenv').config({path: '../.env'});

const pool = new Pool ({
    user: 'postgres',
    host: 'localhost',
    database: 'expense_tracker',
    port: process.env.DB_PORT,
});

module.exports = {
    pool
};