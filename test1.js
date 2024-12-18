(() => {
    'use strict';

    let observer;
    let lastUpdateTimestamp = Date.now();

    // Function to count and get rows matching Planifiée
    function getPlanifieRows() {
        const tbody = document.querySelector('tbody.MuiTableBody-root.datagrid-body.jss80');
        if (!tbody) return { count: 0, results: [] };

        const rows = tbody.querySelectorAll('tr');
        const results = [];

        rows.forEach(tr => {
            const livreurStatusCell = tr.querySelector('td.column-livreur_status span');
            const typeCell = tr.querySelector('td.column-type span');

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
                    results.push(
                        `${collectPointCell.textContent.trim()} [${orderIdCell.textContent.trim()}] : ${orderDateCell.textContent.trim()}`
                    );
                }
            }
        });

        return { count: results.length, results };
    }

    // Function to style the new form
    function styleForm(form) {
        form.style.border = '2px dashed #007bff';
        form.style.padding = '20px';
        form.style.margin = '10px';
        form.style.borderRadius = '8px';
        form.style.backgroundColor = '#f9f9f9';
        form.style.fontFamily = 'Arial, sans-serif';
        form.style.fontSize = '16px';
    }

    // Function to update the form with Planifie count and results
    function updatePlanifieForm() {
        const existingForm = document.querySelector('form.jss55.jss56');
        if (!existingForm) return;

        let newForm = document.getElementById('planifie-results-form');
        if (!newForm) {
            newForm = document.createElement('form');
            newForm.id = 'planifie-results-form';
            newForm.className = 'MuiToolbar-root MuiToolbar-regular jss52 MuiToolbar-gutters';
            styleForm(newForm);

            const nextSibling = existingForm.nextElementSibling;
            existingForm.parentNode.insertBefore(newForm, nextSibling);
        }

        // Clear the form content
        newForm.innerHTML = '';

        // Display Planifie count
        const { count, results } = getPlanifieRows();

        const countLabel = document.createElement('div');
        countLabel.style.fontSize = '1.5em';
        countLabel.style.fontWeight = '600';
        countLabel.textContent = `Planifie: ${count}`;
        newForm.appendChild(countLabel);

        // Display each result
        results.forEach(result => {
            const resultDiv = document.createElement('div');
            resultDiv.textContent = result;
            resultDiv.style.fontSize = '1.2em';
            resultDiv.style.color = '#007bff';
            resultDiv.style.margin = '5px 0';
            newForm.appendChild(resultDiv);
        });
    }

    // Observer logic
    function initializeObserver() {
        observer = new MutationObserver(() => {
            updatePlanifieForm();
            highlightRows(); // Preserve coloring logic
            detectAndHighlightDuplicates();
            lastUpdateTimestamp = Date.now();
        });

        observer.observe(document.body, { childList: true, subtree: true });
        updatePlanifieForm();
    }

    // Function to highlight rows
    function highlightRows() {
        const rows = document.querySelectorAll(
            'tr[resource="orders"], tr[resource="partnerOrders"]'
        );

        rows.forEach(row => {
            const clientStatus = row.querySelector('td.column-client_status span')?.textContent.trim();
            const orderStatus = row.querySelector('td.column-status span')?.textContent.trim();

            if (clientStatus === 'Déposée' || orderStatus === 'Déposée') {
                row.style.backgroundColor = '#42ff79';
            } else if (clientStatus === 'En attente de paiement' || orderStatus === 'En recherche') {
                row.style.backgroundColor = '#ffeb42';
            } else if (clientStatus === 'En préparation' || orderStatus === 'En recherche') {
                row.style.backgroundColor = '#ffeb42';
            } else if (clientStatus === 'Acceptée' || orderStatus === 'En recherche') {
                row.style.backgroundColor = '#67eef4';
            } else if (clientStatus === 'Acceptée' || orderStatus === 'Acceptée') {
                row.style.backgroundColor = '#ffeb42';
            } else if (clientStatus === 'Récupérée' || orderStatus === 'Récupérée') {
                row.style.backgroundColor = '#ffeb42';
            } else if (clientStatus === 'Annulée' || orderStatus === 'Annulée') {
                row.style.backgroundColor = '#ff4242';
            } else if (clientStatus === 'Expirée' || orderStatus === 'Expirée') {
                row.style.backgroundColor = '#ff4242';
            }
        });
    }

    // Duplicate detection logic (kept untouched)
    function detectAndHighlightDuplicates() {
        const tdElements = document.querySelectorAll('td.column-order_id span, td.column-code span');
        const values = Array.from(tdElements).map(span => ({
            value: span.textContent.trim(),
            td: span.closest('td')
        }));

        const valueCounts = {};
        values.forEach(({ value, td }) => {
            if (!valueCounts[value]) valueCounts[value] = { tds: [] };
            valueCounts[value].tds.push(td);
        });

        Object.keys(valueCounts).forEach(value => {
            const { tds } = valueCounts[value];
            if (tds.length > 1) {
                tds.forEach(td => td.style.backgroundColor = '#ffcccc');
            }
        });
    }

    window.addEventListener('load', () => {
        initializeObserver();
        updatePlanifieForm();
        highlightRows();
    });
})();
