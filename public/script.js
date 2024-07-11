document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('expense-form');
    const expenseList = document.getElementById('expense-list');
    const monthlySummary = document.getElementById('monthly-summary').getElementsByTagName('tbody')[0];
    let currentMonth = localStorage.getItem('currentMonth') || new Date().getMonth().toString(); // Obtener el mes almacenado o el mes actual como cadena
    let currentYear = new Date().getFullYear();

    M.FormSelect.init(document.querySelectorAll('select'));

    document.getElementById('year').value = currentYear;
    document.getElementById('month').value = currentMonth; // Establecer el mes seleccionado desde localStorage

    document.getElementById('month').addEventListener('change', function() {
        currentMonth = this.value;
        localStorage.setItem('currentMonth', currentMonth); // Almacenar el mes seleccionado en localStorage
        updateExpenseList();
        updateMonthlySummary();
    });

    document.getElementById('year').addEventListener('change', function() {
        currentYear = parseInt(this.value);
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

        // Obtener la fecha actual solo para visualización, no para modificar la fecha real
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
                    updateMonthlySummary();
                } catch (error) {
                    console.error('Error al eliminar gasto:', error);
                    alert('Error al eliminar gasto');
                }
            });
        });

        // Agregar event listener para botones de editar
        const editButtons = document.querySelectorAll('.edit-btn');
        editButtons.forEach(button => {
            button.addEventListener('click', async () => {
                const expenseId = button.getAttribute('data-id');
                // Implementa la lógica para editar el gasto aquí
                console.log('Implementa la lógica para editar el gasto con ID:', expenseId);
                // Puedes abrir un modal con los datos actuales y permitir la edición
            });
        });
    }

    function renderMonthlySummary(summary) {
        monthlySummary.innerHTML = '';
        summary.forEach(monthData => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${new Date(monthData.year, monthData.month).toLocaleString('es-ES', { month: 'long', year: 'numeric' })}</td>
                <td>${monthData.total.toFixed(2)}</td>
            `;
            monthlySummary.appendChild(tr);
        });
    }

    updateExpenseList();
    updateMonthlySummary();
});
