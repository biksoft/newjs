(() => {
    'use strict';

    // Function to count rows matching the specified conditions
    function countMatchingRows() {
        const tbody = document.querySelector('tbody.MuiTableBody-root.datagrid-body.jss80');

        if (!tbody) {
            console.error('The table body was not found.');
            return 0;
        }

        const rows = tbody.querySelectorAll('tr');

        // Filter rows based on the conditions
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

    // Function to style the form
    function styleForm(form) {
        form.style.border = '2px dashed #007bff';
        form.style.padding = '20px';
        form.style.margin = '10px';
        form.style.borderRadius = '8px';
        form.style.backgroundColor = '#f9f9f9';
        form.style.fontFamily = 'Arial, sans-serif';
        form.style.fontSize = '16px'; // Double the size of text
    }

    // Function to add the new field to the form
    function addPlanifieFieldToForm() {
        const form = document.querySelector('form.jss55.jss56');

        if (!form) {
            console.error('The form was not found.');
            return;
        }

        // Apply modern styling to the form
        styleForm(form);

        // Create a new div to contain the field
        const fieldDiv = document.createElement('div');
        fieldDiv.className = 'filter-field';
        fieldDiv.style.marginTop = '15px';
        fieldDiv.style.display = 'flex';
        fieldDiv.style.alignItems = 'center';

        // Create a label for the field
        const label = document.createElement('label');
        label.textContent = 'Planifie:';
        label.style.marginRight = '12px';
        label.style.fontSize = '1.5em';
        label.style.fontWeight = '600';
        label.style.color = '#333';

        // Create a span to display the count
        const countSpan = document.createElement('span');
        countSpan.textContent = countMatchingRows();
        countSpan.style.fontWeight = 'bold';
        countSpan.style.fontSize = '1.5em';
        countSpan.style.color = '#007bff';

        // Append the label and span to the div
        fieldDiv.appendChild(label);
        fieldDiv.appendChild(countSpan);

        // Find the jss59 and jss57 elements
        const jss59Element = form.querySelector('.jss59');
        const jss57Element = form.querySelector('.jss57');

        if (jss59Element) {
            // Append the new field after the jss59 element
            jss59Element.parentNode.insertBefore(fieldDiv, jss57Element);
        } else {
            console.error('The jss59 element was not found.');
        }

        // Set up the interval to refresh the count every 10 seconds
        setInterval(() => {
            countSpan.textContent = countMatchingRows();
        }, 10000);
    }

    // Run the function on page load
    window.addEventListener('load', addPlanifieFieldToForm);
})();
