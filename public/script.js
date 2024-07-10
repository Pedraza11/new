document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('expense-form');
    const expenseList = document.getElementById('expense-list');
    const monthlySummary = document.getElementById('monthly-summary');
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
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(expenseData),
            });

            if (!response.ok) {
                throw new Error('Error al agregar gasto');
            }

            form.reset();
            M.updateTextFields();
            M.toast({ html: 'Gasto agregado exitosamente' });
            updateExpenseList();
        } catch (error) {
            console.error('Error al agregar gasto:', error);
            alert('Error al agregar gasto');
        }
    });

    async function updateExpenseList() {
        try {
            const response = await fetch(`/expenses?month=${currentMonth}&year=${currentYear}`);
            if (!response.ok) {
                throw new Error('Error al obtener la lista de gastos');
            }
            const expenses = await response.json();
            renderExpenses(expenses);
        } catch (error) {
            console.error('Error al obtener la lista de gastos:', error);
        }
    }

    function renderExpenses(expenses) {
        expenseList.innerHTML = '';
        expenses.forEach(expense => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${expense.description}</td>
                <td>${expense.amount.toFixed(2)}</td>
                <td>${expense.date}</td>
                <td><button class="btn red delete-btn" data-id="${expense.id}">Eliminar</button></td>
            `;
            expenseList.appendChild(tr);
        });

        // Agregar event listener para botones de eliminar
        const deleteButtons = document.querySelectorAll('.delete-btn');
        deleteButtons.forEach(button => {
            button.addEventListener('click', async () => {
                const expenseId = button.getAttribute('data-id');
                try {
                    const response = await fetch(`/delete-expense/${expenseId}`, {
                        method: 'DELETE',
                    });

                    if (!response.ok) {
                        throw new Error('Error al eliminar gasto');
                    }

                    M.toast({ html: 'Gasto eliminado exitosamente' });
                    updateExpenseList();
                } catch (error) {
                    console.error('Error al eliminar gasto:', error);
                    alert('Error al eliminar gasto');
                }
            });
        });
    }

    updateExpenseList();
});
