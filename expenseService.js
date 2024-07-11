const pool=require('./db')

const addExpense = async (description, amount, date, month, year) => {
    try {
        const res = await pool.query(
            'INSERT INTO expenses (description, amount, date, month, year) VALUES ($1, $2, $3, $4, $5)',
            [description, amount, date, month, year]
        );
        console.log('Gasto agregado:', res.rows);
        return res.rows;
    } catch (error) {
        console.error('Error al agregar gasto:', error);
        throw error;
    }
};

const getExpensesByMonthAndYear = async (month, year) => {
    try {
        const res = await pool.query('SELECT * FROM expenses WHERE month = $1 AND year = $2', [month, year]);
        const expenses = res.rows.map(expense => ({
            ...expense,
            amount: parseFloat(expense.amount)
        }));
        return expenses;
    } catch (error) {
        console.error('Error al obtener gastos por mes y año:', error);
        throw error;
    }
};

const getExpensesByYear = async (year) => {
    try {
        const res = await pool.query('SELECT * FROM expenses WHERE year = $1', [year]);
        const expenses = res.rows.map(expense => ({
            ...expense,
            amount: parseFloat(expense.amount)
        }));
        return expenses;
    } catch (error) {
        console.error('Error al obtener gastos por año:', error);
        throw error;
    }
};

module.exports = {
    addExpense,
    getExpensesByMonthAndYear,
    getExpensesByYear,
};
