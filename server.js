const express = require('express');
const bodyParser = require('body-parser');
const { addExpense, getExpensesByYear } = require('./expenseService'); // Asegúrate de importar la función correcta

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static(__dirname)); // Servir archivos estáticos desde el directorio actual

// Ruta para la página de inicio
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Ruta para agregar un nuevo gasto
app.post('/add-expense', async (req, res) => {
    const { description, amount, date, month, year } = req.body;
    try {
        await addExpense(description, amount, date, month, year);
        res.status(200).send('Gasto agregado');
    } catch (error) {
        console.error('Error al agregar gasto:', error);
        res.status(500).send('Error al agregar gasto');
    }
});

// Ruta para obtener todos los gastos de un año específico
app.get('/expenses', async (req, res) => {
    const { year } = req.query;
    try {
        const expenses = await getExpensesByYear(year);
        res.status(200).json(expenses); // Devolver los gastos como JSON válido
    } catch (error) {
        console.error('Error al obtener gastos:', error);
        res.status(500).send('Error al obtener gastos');
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
