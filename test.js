(() => {
    'use strict';

    // Function to count matching rows in the table
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

    // Function to create the form if it doesn't already exist
    function addPlanifieFieldToForm() {
        const form = document.querySelector('form.jss55.jss56');
        if (!form || form.querySelector('.filter-field')) return;

        // Style the form
        form.style.border = '2px dashed #007bff';
        form.style.padding = '20px';
        form.style.margin = '10px';
        form.style.borderRadius = '8px';
        form.style.backgroundColor = '#f9f9f9';
        form.style.fontFamily = 'Arial, sans-serif';
        form.style.fontSize = '16px';

        // Create the field
        const fieldDiv = document.createElement('div');
        fieldDiv.className = 'filter-field';
        fieldDiv.style.marginTop = '15px';
        fieldDiv.style.display = 'flex';
        fieldDiv.style.alignItems = 'center';

        const label = document.createElement('label');
        label.textContent = 'Planifie:';
        label.style.marginRight = '12px';
        label.style.fontSize = '1.5em';
        label.style.fontWeight = '600';
        label.style.color = '#333';

        const countSpan = document.createElement('span');
        countSpan.textContent = countMatchingRows();
        countSpan.style.fontWeight = 'bold';
        countSpan.style.fontSize = '1.5em';
        countSpan.style.color = '#007bff';

        fieldDiv.appendChild(label);
        fieldDiv.appendChild(countSpan);
        form.appendChild(fieldDiv);

        // Update count every 5 seconds
        setInterval(() => {
            countSpan.textContent = countMatchingRows();
        }, 5000);
    }

    // Function to monitor React-based navigation
    function monitorNavigation() {
        let lastURL = window.location.href;

        setInterval(() => {
            const currentURL = window.location.href;

            if (currentURL !== lastURL) {
                lastURL = currentURL;

                // Check if the URL matches the relevant pages
                if (
                    currentURL.includes('/#/partnerOrders') ||
                    currentURL.includes('/#/orders')
                ) {
                    setTimeout(() => {
                        addPlanifieFieldToForm(); // Ensure the form is recreated
                    }, 500); // Delay for React rendering
                }
            }
        }, 500); // Check for navigation changes every 500ms
    }

    // Initialize the script
    monitorNavigation();
    addPlanifieFieldToForm();
})();
