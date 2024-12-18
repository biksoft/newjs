(() => {
    'use strict';

    let observer;

    // Function to count matching rows and format results
    function countAndFormatMatchingRows() {
        const tbody = document.querySelector('tbody.MuiTableBody-root.datagrid-body.jss80');

        if (!tbody) {
            console.error('The table body was not found.');
            return [];
        }

        const rows = tbody.querySelectorAll('tr');
        const results = [];

        rows.forEach(tr => {
            const livreurStatusCell = tr.querySelector('td.column-livreur_status span');
            const typeCell = tr.querySelector('td.column-type span');

            // Check conditions for Planifiée rows
            if (
                (livreurStatusCell?.textContent.trim() === 'En recherche' &&
                    typeCell?.textContent.trim() === 'Planifiée') ||
                (livreurStatusCell?.textContent.trim() === 'Acceptée' &&
                    typeCell?.textContent.trim() === 'Planifiée')
            ) {
                const collectPointCell = tr.querySelector('td.column-collect_point\\.name span');
                const orderIdCell = tr.querySelector('td.column-order_id span');
                const orderDateCell = tr.querySelector('td.column-order_date span');

                if (collectPointCell && orderIdCell && orderDateCell) {
                    const result = `${collectPointCell.textContent.trim()} [${orderIdCell.textContent.trim()}] : ${orderDateCell.textContent.trim()}`;
                    results.push(result);
                }
            }
        });

        return results;
    }

    // Function to style the form
    function styleForm(form) {
        form.style.border = '2px dashed #007bff';
        form.style.padding = '20px';
        form.style.margin = '10px';
        form.style.borderRadius = '8px';
        form.style.backgroundColor = '#f9f9f9';
        form.style.fontFamily = 'Arial, sans-serif';
        form.style.fontSize = '16px';
    }

    // Function to create and update the new form
    function createOrUpdateNewForm() {
        const existingForm = document.querySelector('form.jss55.jss56');
        if (!existingForm) {
            console.error('The form.jss55.jss56 was not found.');
            return;
        }

        const nextSibling = existingForm.nextElementSibling;
        if (!nextSibling || nextSibling.tagName !== 'SPAN') {
            console.error('The <span> element was not found as the next sibling of the form.');
            return;
        }

        let newForm = document.getElementById('planifie-results-form');
        if (!newForm) {
            newForm = document.createElement('form');
            newForm.id = 'planifie-results-form';
            newForm.className = 'MuiToolbar-root MuiToolbar-regular jss52 MuiToolbar-gutters';
            styleForm(newForm);
            existingForm.parentNode.insertBefore(newForm, nextSibling);
        }

        const results = countAndFormatMatchingRows();

        newForm.innerHTML = ''; // Clear the form
        const label = document.createElement('label');
        label.textContent = 'Planifie Results:';
        label.style.fontSize = '1.5em';
        label.style.fontWeight = '600';
        label.style.color = '#333';
        newForm.appendChild(label);

        results.forEach(result => {
            const resultDiv = document.createElement('div');
            resultDiv.textContent = result;
            resultDiv.style.margin = '5px 0';
            resultDiv.style.fontSize = '1.2em';
            resultDiv.style.color = '#007bff';
            newForm.appendChild(resultDiv);
        });
    }

    // Observer to update results dynamically
    function initializeObserver() {
        observer = new MutationObserver(() => {
            createOrUpdateNewForm();
        });

        observer.observe(document.body, { childList: true, subtree: true });
        createOrUpdateNewForm();
    }

    window.addEventListener('load', () => {
        initializeObserver();
        setInterval(createOrUpdateNewForm, 10000); // Refresh every 10 seconds
    });
})();
