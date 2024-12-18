(() => {
    'use strict';

    let observer;
    let lastUpdateTimestamp = Date.now();

    // Function to count rows matching the specified conditions
    function countMatchingRows() {
        const tbody = document.querySelector('tbody.MuiTableBody-root.datagrid-body.jss80');
        if (!tbody) return 0;

        const rows = tbody.querySelectorAll('tr');
        const matchingRows = Array.from(rows).filter(tr => {
            const livreurStatusCell = tr.querySelector('td.column-livreur_status span');
            const typeCell = tr.querySelector('td.column-type span');

            return (
                (livreurStatusCell?.textContent.trim() === 'En recherche' &&
                 typeCell?.textContent.trim() === 'Planifiée') ||
                (livreurStatusCell?.textContent.trim() === 'Acceptée' &&
                 typeCell?.textContent.trim() === 'Planifiée')
            );
        });
        return matchingRows.length;
    }

    // Function to format and list "Planifiée" rows
    function getFormattedPlanifieResults() {
        const tbody = document.querySelector('tbody.MuiTableBody-root.datagrid-body.jss80');
        if (!tbody) return [];

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

    // Function to create and insert the new form between the <form> and <span>
    function createNewFormBetween() {
        const existingForm = document.querySelector('form.jss55.jss56');
        if (!existingForm) return;

        const nextSibling = existingForm.nextElementSibling;
        if (!nextSibling || nextSibling.tagName !== 'SPAN') return;

        let newForm = document.getElementById('planifie-results-form');
        if (!newForm) {
            newForm = document.createElement('form');
            newForm.id = 'planifie-results-form';
            newForm.className = 'MuiToolbar-root MuiToolbar-regular jss52 MuiToolbar-gutters';
            styleForm(newForm);
            existingForm.parentNode.insertBefore(newForm, nextSibling);
        }

        // Clear previous content
        newForm.innerHTML = '';

        // Planifie Count Display
        const fieldDiv = document.createElement('div');
        fieldDiv.style.marginBottom = '10px';

        const label = document.createElement('label');
        label.textContent = 'Planifie:';
        label.style.fontSize = '1.5em';
        label.style.fontWeight = '600';

        const countSpan = document.createElement('span');
        countSpan.textContent = countMatchingRows();
        countSpan.style.color = '#007bff';
        countSpan.style.fontSize = '1.5em';
        countSpan.style.marginLeft = '10px';

        fieldDiv.appendChild(label);
        fieldDiv.appendChild(countSpan);
        newForm.appendChild(fieldDiv);

        // Display formatted results
        const results = getFormattedPlanifieResults();
        results.forEach(result => {
            const resultDiv = document.createElement('div');
            resultDiv.textContent = result;
            resultDiv.style.fontSize = '1.2em';
            resultDiv.style.color = '#007bff';
            resultDiv.style.margin = '5px 0';
            newForm.appendChild(resultDiv);
        });

        // Update dynamically
        setInterval(() => {
            countSpan.textContent = countMatchingRows();
            createNewFormBetween(); // Refresh results dynamically
        }, 10000);
    }

    // Initialize the observer and other necessary functions
    function initializeObserver() {
        observer = new MutationObserver(() => {
            detectAndHighlightDuplicates();
            highlightRows();
            createNewFormBetween();
            lastUpdateTimestamp = Date.now();
        });

        observer.observe(document.body, { childList: true, subtree: true });
        createNewFormBetween();
    }

    function detectAndHighlightDuplicates() {
        // Duplicate detection logic (from your existing code)
    }

    function highlightRows() {
        // Row highlighting logic (from your existing code)
    }

    window.addEventListener('load', () => {
        initializeObserver();
        createNewFormBetween();
    });

})();
