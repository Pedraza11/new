document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('expense-form');
    const expenseList = document.getElementById('expense-list');
    const yearlySummary = document.getElementById('yearly-summary');
    let totalExpenses = 0;
    let currentMonth = new Date().getMonth();
    let currentYear = new Date().getFullYear();

    M.FormSelect.init(document.querySelectorAll('select'));

    document.getElementById('month').selectedIndex = currentMonth;
    document.getElementById('year').value = currentYear;

    document.getElementById('month').addEventListener('change', function() {
        currentMonth = parseInt(this.value);
        updateExpenseList();
    });

    document.getElementById('year').addEventListener('change', function() {
        currentYear = parseInt(this.value);
        updateExpenseList();
    });

    form.addEventListener('submit', async function(event) {
        event.preventDefault();
        const description = document.getElementById('description').value;
        const amount = parseFloat(document.getElementById('amount').value);

        if (description.trim() === '' || isNaN(amount) || amount <= 0) {
            alert('Por favor ingrese valores válidos para la descripción y el monto.');
            return;
        }

        const date = new Date(currentYear, currentMonth, new Date().getDate()).toLocaleDateString();
        const expenseData = { description, amount, date, month: currentMonth, year: currentYear };

        try {
            const response = await fetch('/add-expense', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(expenseData)
            });
            if (!response.ok) {
                throw new Error('Error al agregar gasto');
            }
            updateExpenseList();
        } catch (error) {
            alert('Error al agregar gasto');
            console.error('Error al agregar gasto:', error);
        }

        form.reset();
    });

    async function updateExpenseList() {
        try {
            const response = await fetch(`/expenses?year=${currentYear}`);
            if (!response.ok) {
                throw new Error('Error al obtener gastos');
            }
            const expenses = await response.json();
            console.log('Gastos obtenidos:', expenses); // Verifica si se están obteniendo los gastos correctamente
            renderExpenses(expenses);
        } catch (error) {
            console.error('Error al obtener la lista de gastos:', error);
        }
    }

    function renderExpenses(expenses) {
        console.log('Renderizando gastos:', expenses); // Verifica si se está llamando correctamente a renderExpenses
        if (!expenseList) {
            console.error('No se encontró expenseList en el DOM.');
            return;
        }
        expenseList.innerHTML = '';
        totalExpenses = 0;
        expenses.forEach(expense => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${expense.description}</td>
                <td>${expense.amount.toFixed(2)}</td>
                <td>${expense.date}</td>
                <td><button class="btn red">Eliminar</button></td>
            `;
            expenseList.appendChild(row);
            totalExpenses += expense.amount;
        });
        renderYearlySummary(expenses);
    }

    function renderYearlySummary(expenses) {
        console.log('Renderizando resumen anual:', expenses); // Verifica si se está llamando correctamente a renderYearlySummary
        if (!yearlySummary) {
            console.error('No se encontró yearlySummary en el DOM.');
            return;
        }
        const yearlyTotals = {};

        expenses.forEach(expense => {
            const { month, amount } = expense;
            if (!yearlyTotals[month]) {
                yearlyTotals[month] = 0;
            }
            yearlyTotals[month] += amount;
        });

        yearlySummary.innerHTML = '';

        Object.keys(yearlyTotals).forEach(month => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${new Date(currentYear, month).toLocaleString('default', { month: 'long' })}</td>
                <td>${yearlyTotals[month].toFixed(2)}</td>
            `;
            yearlySummary.appendChild(row);
        });
    }

    // Llamar a updateExpenseList al cargar la página
    updateExpenseList();
});
