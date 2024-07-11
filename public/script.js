document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('expense-form');
    const expenseList = document.getElementById('expense-list');
    const monthlySummary = document.getElementById('monthly-summary').getElementsByTagName('tbody')[0];
    const monthSelect = document.getElementById('month');
    const yearInput = document.getElementById('year');
    let currentMonth = localStorage.getItem('currentMonth') || new Date().getMonth().toString();
    let currentYear = new Date().getFullYear().toString();

    M.FormSelect.init(document.querySelectorAll('select'));

    // Establecer el mes y año seleccionados al cargar la página
    yearInput.value = currentYear;
    monthSelect.value = currentMonth;

    // Forzar la actualización del selector de Materialize para que muestre el valor almacenado
    M.FormSelect.getInstance(monthSelect).destroy();
    M.FormSelect.init(document.querySelectorAll('select'));

    monthSelect.addEventListener('change', function() {
        currentMonth = this.value;
        localStorage.setItem('currentMonth', currentMonth);
        updateExpenseList();
        updateMonthlySummary();
    });

    yearInput.addEventListener('change', function() {
        currentYear = this.value;
        localStorage.setItem('currentYear', currentYear);
        updateExpenseList();
        updateMonthlySummary();
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

            // Restaurar el valor del selector de mes después de resetear el formulario
            monthSelect.value = currentMonth;
            yearInput.value = currentYear;

            M.FormSelect.getInstance(monthSelect).destroy();
            M.FormSelect.init(document.querySelectorAll('select'));

            M.toast({ html: 'Gasto agregado exitosamente' });
            updateExpenseList();
            updateMonthlySummary();
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

    async function updateMonthlySummary() {
        try {
            const response = await fetch(`/monthly-summary?year=${currentYear}`);
            if (!response.ok) {
                throw new Error('Error al obtener el resumen mensual');
            }
            const summary = await response.json();
            renderMonthlySummary(summary);
        } catch (error) {
            console.error('Error al obtener el resumen mensual:', error);
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
                <td><button class="btn orange edit-btn" data-id="${expense.id}">Editar</button></td>
            `;
            expenseList.appendChild(tr);
        });

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
                    updateMonthlySummary();
                } catch (error) {
                    console.error('Error al eliminar gasto:', error);
                    alert('Error al eliminar gasto');
                }
            });
        });

        const editButtons = document.querySelectorAll('.edit-btn');
        editButtons.forEach(button => {
            button.addEventListener('click', async () => {
                const expenseId = button.getAttribute('data-id');
                console.log('Implementa la lógica para editar el gasto con ID:', expenseId);
                // Aquí puedes implementar la lógica para editar el gasto
            });
        });
    }

    function renderMonthlySummary(summary) {
        monthlySummary.innerHTML = '';
        summary.forEach(monthly => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${monthly.month}/${monthly.year}</td>
                <td>${monthly.total.toFixed(2)}</td>
            `;
            monthlySummary.appendChild(tr);
        });
    }

    updateExpenseList();
    updateMonthlySummary();
});
