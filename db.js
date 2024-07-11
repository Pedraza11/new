const { Pool } = require('pg');

const pool = new Pool({
    user: 'gastos',
    host: 'dpg-cq86dnss1f4s73cg6fbg-a',
    database: 'expense_management_qn0p',
    password: 'rjxcvzrFlj4ol4HfwAw89YnKeAN86kLB',
    port: 5432,
});

module.exports = pool;
