const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');

const { addExpense, getExpensesByMonthAndYear, getExpensesByYear } = require('./expenseService');

const app = express();
const PORT = process.env.PORT || 3000;

const pool=require('./db')

app.use(bodyParser.json());
app.use(express.static(__dirname + '/public')); // Servir archivos estáticos desde el directorio 'public'

// Ruta para servir la página principal
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// Ruta para agregar un gasto
app.post('/add-expense', async (req, res) => {
    const { description, amount, date, month, year } = req.body;
    try {
        const client = await pool.connect();
        const result = await client.query(
            'INSERT INTO expenses (description, amount, date, month, year) VALUES ($1, $2, $3, $4, $5)',
            [description, amount, date, month, year]
        );
        client.release();
        console.log('Gasto agregado:', result.rows);
        res.status(200).send('Gasto agregado');
    } catch (error) {
        console.error('Error al agregar gasto:', error);
        res.status(500).send('Error al agregar gasto');
    }
});

// Ruta para obtener gastos filtrados por mes y año
app.get('/expenses', async (req, res) => {
    const { month, year } = req.query;
    try {
        const client = await pool.connect();
        let query = 'SELECT * FROM expenses';
        const params = [];

        if (month && year) {
            query += ' WHERE month = $1 AND year = $2';
            params.push(month, year);
        } else if (year) {
            query += ' WHERE year = $1';
            params.push(year);
        }

        const result = await client.query(query, params);
        client.release();
        const expenses = result.rows.map(expense => ({
            ...expense,
            amount: parseFloat(expense.amount)
        }));
        res.status(200).json(expenses);
    } catch (error) {
        console.error('Error al obtener gastos:', error);
        res.status(500).send('Error al obtener gastos');
    }
});

// Ruta para obtener el resumen mensual
app.get('/monthly-summary', async (req, res) => {
    const { year } = req.query;
    try {
        const client = await pool.connect();
        const result = await client.query(
            `SELECT month, year, SUM(amount) as total 
             FROM expenses 
             WHERE year = $1 
             GROUP BY month, year 
             ORDER BY year, month`,
            [year]
        );
        client.release();
        const summary = result.rows.map(row => ({
            month: row.month,
            year: row.year,
            total: parseFloat(row.total)
        }));
        res.status(200).json(summary);
    } catch (error) {
        console.error('Error al obtener resumen mensual:', error);
        res.status(500).send('Error al obtener resumen mensual');
    }
});

// Ruta para eliminar un gasto por ID
app.delete('/delete-expense/:id', async (req, res) => {
    const expenseId = req.params.id;
    try {
        const client = await pool.connect();
        const result = await client.query('DELETE FROM expenses WHERE id = $1', [expenseId]);
        client.release();
        console.log('Gasto eliminado:', result.rowCount);
        res.status(200).send('Gasto eliminado');
    } catch (error) {
        console.error('Error al eliminar gasto:', error);
        res.status(500).send('Error al eliminar gasto');
    }
});

// Ruta para actualizar un gasto por ID
app.put('/edit-expense/:id', async (req, res) => {
    const expenseId = req.params.id;
    const { description, amount, date, month, year } = req.body;
    try {
        const client = await pool.connect();
        const result = await client.query(
            `UPDATE expenses 
             SET description = $1, amount = $2, date = $3, month = $4, year = $5 
             WHERE id = $6`,
            [description, amount, date, month, year, expenseId]
        );
        client.release();
        console.log('Gasto actualizado:', result.rowCount);
        res.status(200).send('Gasto actualizado');
    } catch (error) {
        console.error('Error al actualizar gasto:', error);
        res.status(500).send('Error al actualizar gasto');
    }
});

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
