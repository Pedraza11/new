document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('expense-form');
    const expenseList = document.getElementById('expense-list');
    const monthlySummary = document.getElementById('monthly-summary');
    const notification = document.createElement('div');
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

    form.addEventListener('submit', function(event) {
        event.preventDefault();
        const description = document.getElementById('description').value;
        const amount = parseFloat(document.getElementById('amount').value);

        if (description.trim() === '' || isNaN(amount) || amount <= 0) {
            alert('Por favor ingrese valores válidos para la descripción y el monto.');
            return;
        }

        const date = new Date(currentYear, currentMonth, new Date().getDate()).toLocaleDateString();
        const existingRow = expenseList.querySelector(`tr[data-id="${form.dataset.id}"]`);

        if (existingRow) {
            updateExpense(description, amount, date, existingRow);
        } else {
            addExpense(description, amount, date);
        }

        form.reset();
        form.dataset.id = ''; // Limpia el ID de gasto actual después de la operación

        checkExceedPreviousMonth();
        checkAndAlertTotalExpenses();
    });

    expenseList.addEventListener('click', function(event) {
        if (event.target.classList.contains('edit-expense')) {
            event.preventDefault();
            const row = event.target.closest('tr');
            const description = row.querySelector('[data-field="description"]').textContent;
            const amount = parseFloat(row.querySelector('[data-field="amount"]').textContent.replace('$', ''));

            document.getElementById('description').value = description;
            document.getElementById('amount').value = amount;

            document.querySelector('.submit-btn').textContent = 'Actualizar';
            form.dataset.id = row.dataset.id;
        }
    });

    function addExpense(description, amount, date) {
        const newExpenseKey = firebase.database().ref().child('expenses').push().key;
        const expenseData = {
            description: description,
            amount: amount,
            date: date,
            month: currentMonth,
            year: currentYear
        };

        let updates = {};
        updates['/expenses/' + newExpenseKey] = expenseData;

        firebase.database().ref().update(updates);

        const row = document.createElement('tr');
        row.dataset.id = newExpenseKey;
        row.innerHTML = `
            <td data-field="description">${description}</td>
            <td data-field="amount">$${amount.toFixed(2)}</td>
            <td data-field="date">${date}</td>
            <td>
                <a href="#" class="edit-expense">Editar</a>
            </td>
        `;
        expenseList.appendChild(row);

        totalExpenses += amount;
        updateMonthlySummary();
        checkAndAlertTotalExpenses();
    }

    function updateExpense(description, amount, date, rowToUpdate) {
        const expenseId = rowToUpdate.dataset.id;
        const expenseData = {
            description: description,
            amount: amount,
            date: date,
            month: currentMonth,
            year: currentYear
        };

        let updates = {};
        updates['/expenses/' + expenseId] = expenseData;

        firebase.database().ref().update(updates);

        rowToUpdate.innerHTML = `
            <td data-field="description">${description}</td>
            <td data-field="amount">$${amount.toFixed(2)}</td>
            <td data-field="date">${date}</td>
            <td>
                <a href="#" class="edit-expense">Editar</a>
            </td>
        `;

        totalExpenses = 0;
        expenseList.querySelectorAll('tr').forEach(row => {
            totalExpenses += parseFloat(row.querySelector('[data-field="amount"]').textContent.replace('$', ''));
        });

        updateMonthlySummary();
        checkAndAlertTotalExpenses();
    }

    function updateExpenseList() {
        firebase.database().ref('expenses').orderByChild('year').equalTo(currentYear).once('value', snapshot => {
            expenseList.innerHTML = '';
            totalExpenses = 0;

            snapshot.forEach(childSnapshot => {
                const expense = childSnapshot.val();
                if (expense.month === currentMonth) {
                    const row = document.createElement('tr');
                    row.dataset.id = childSnapshot.key;
                    row.innerHTML = `
                        <td data-field="description">${expense.description}</td>
                        <td data-field="amount">$${expense.amount.toFixed(2)}</td>
                        <td data-field="date">${expense.date}</td>
                        <td>
                            <a href="#" class="edit-expense">Editar</a>
                        </td>
                    `;
                    expenseList.appendChild(row);
                    totalExpenses += expense.amount;
                }
            });

            updateMonthlySummary();
            checkAndAlertTotalExpenses();
        });
    }

    function updateMonthlySummary() {
        monthlySummary.innerHTML = `
            <tr>
                <td>${new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long' })}</td>
                <td>$${totalExpenses.toFixed(2)}</td>
            </tr>
        `;
    }

    function checkExceedPreviousMonth() {
        const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;

        firebase.database().ref('expenses').orderByChild('year').equalTo(previousYear).once('value', snapshot => {
            let previousMonthTotal = 0;

            snapshot.forEach(childSnapshot => {
                const expense = childSnapshot.val();
                if (expense.month === previousMonth) {
                    previousMonthTotal += expense.amount;
                }
            });

            if (totalExpenses > previousMonthTotal) {
                showNotification(`Has gastado más este mes que en ${new Date(previousYear, previousMonth).toLocaleString('default', { month: 'long' })}.`);
            }
        });
    }

    function checkAndAlertTotalExpenses() {
        const alertThreshold = 100000;
        const totalMultiple = Math.floor(totalExpenses / alertThreshold);

        if (totalMultiple > 0) {
            showTotalExpensesAlert(totalMultiple * alertThreshold);
        }
    }

    function showTotalExpensesAlert(amount) {
        const alertMessage = `¡Ya has gastado ${amount.toLocaleString('es-ES')}!`;

        const alertBox = document.createElement('div');
        alertBox.classList.add('alert-box');
        alertBox.style.backgroundColor = 'red';
        alertBox.style.position = 'fixed';
        alertBox.style.top = '50%';
        alertBox.style.left = '50%';
        alertBox.style.transform = 'translate(-50%, -50%)';
        alertBox.style.padding = '20px';
        alertBox.style.border = '1px solid #ccc';
        alertBox.style.borderRadius = '5px';
        alertBox.style.zIndex = '9999';
        alertBox.textContent = alertMessage;

        document.body.appendChild(alertBox);

        // Ocultar la alerta después de 3 segundos
        setTimeout(function() {
            alertBox.style.opacity = '0';
            setTimeout(function() {
                alertBox.remove();
            }, 1000);
        }, 3000);
    }

    function showNotification(message) {
        notification.textContent = message;
        notification.classList.add('notification', 'show');
        document.body.appendChild(notification);

        setTimeout(function() {
            notification.classList.remove('show');
            notification.classList.add('hide');
            setTimeout(function() {
                notification.remove();
            }, 500);
        }, 3000);
    }

    // Evento de clic para el botón de modo oscuro
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    darkModeToggle.addEventListener('click', function() {
        document.body.classList.toggle('dark-mode');
    });

    // Inicializar la lista de gastos al cargar la página
    updateExpenseList();
});
