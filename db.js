const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'expense_management',
    password: 'SANti11.11',
    port: 5432,
});

module.exports = pool;
