(() => {
    'use strict';

    let observer;
    let lastUpdateTimestamp = Date.now();

    // Function to count rows matching the specified conditions
    function countMatchingRows() {
        // Select all rows in the table body
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

    // Function to create and insert the new form between the <form> and <span>
    function createNewFormBetween() {
        // Find the <form class="jss55 jss56"> element
        const existingForm = document.querySelector('form.jss55.jss56');
        if (!existingForm) {
            console.error('The form.jss55.jss56 was not found.');
            return;
        }

        // Find the next sibling <span> element (we will insert the new form before it)
        const nextSibling = existingForm.nextElementSibling;
        if (!nextSibling || nextSibling.tagName !== 'SPAN') {
            console.error('The <span> element was not found as the next sibling of the form.');
            return;
        }

        // Create the new form element
        const newForm = document.createElement('form');
        newForm.className = 'MuiToolbar-root MuiToolbar-regular jss52 MuiToolbar-gutters';

        // Apply modern styling to the new form
        styleForm(newForm);

        // Create a new div to contain the "Planifie" field
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

        // Create a span to display the count of matching rows
        const countSpan = document.createElement('span');
        countSpan.textContent = countMatchingRows();
        countSpan.style.fontWeight = 'bold';
        countSpan.style.fontSize = '1.5em';
        countSpan.style.color = '#007bff';

        // Append the label and countSpan to the fieldDiv
        fieldDiv.appendChild(label);
        fieldDiv.appendChild(countSpan);

        // Append the new fieldDiv to the new form
        newForm.appendChild(fieldDiv);

        // Insert the new form before the <span> element
        existingForm.parentNode.insertBefore(newForm, nextSibling);

        // Set up the interval to refresh the count every 10 seconds
        setInterval(() => {
            countSpan.textContent = countMatchingRows();
        }, 1000);
    }

    // Initialize the observer and other necessary functions
    function initializeObserver() {
        observer = new MutationObserver(() => {
            detectAndHighlightDuplicates();
            highlightRows();
            lastUpdateTimestamp = Date.now();
        });

        observer.observe(document.body, { childList: true, subtree: true });
        detectAndHighlightDuplicates();
        highlightRows();
    }

    // Function to highlight rows based on specific conditions
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
            } else if (clientStatus === 'Prête' || orderStatus === 'Acceptée') {
                row.style.backgroundColor = '#ffeb42';
            } else if (clientStatus === 'Annulée' || orderStatus === 'Annulée') {
                row.style.backgroundColor = '#ff4242';
            } else if (clientStatus === 'Expirée' || orderStatus === 'Expirée') {
                row.style.backgroundColor = '#ff4242';
            }
        });
    }

    // Detect and highlight duplicate entries in the table
    function detectAndHighlightDuplicates() {
        if (observer) observer.disconnect();

        const tdElements = document.querySelectorAll(
            'td.column-order_id span, td.column-code span'
        );

        const values = Array.from(tdElements).map(span => ({
            value: span.textContent.trim(),
            td: span.closest('td')
        }));

        const valueCounts = {};
        values.forEach(({ value, td }) => {
            if (!valueCounts[value]) {
                valueCounts[value] = { tds: [] };
            }
            valueCounts[value].tds.push(td);
        });

        Object.keys(valueCounts).forEach(value => {
            const { tds } = valueCounts[value];
            const count = tds.length;

            if (count > 1) {
                cleanEmoji(tds[0]);
                addEmoji(tds[0], '🔴', 'duplicate-emoji-red');

                tds.slice(1, -1).forEach(td => {
                    cleanEmoji(td);
                    addEmoji(td, '🔴', 'duplicate-emoji-red');
                });

                const lastDuplicate = tds[tds.length - 1];
                cleanEmoji(lastDuplicate);
                addEmoji(lastDuplicate, '✅', 'duplicate-emoji-green');
            } else {
                tds.forEach(td => cleanEmoji(td));
            }
        });

        if (observer) observer.observe(document.body, { childList: true, subtree: true });
    }

    // Add emoji to indicate duplicates
    function addEmoji(td, emoji, className) {
        if (!td.querySelector(`.${className}`)) {
            const emojiSpan = document.createElement('span');
            emojiSpan.textContent = emoji;
            emojiSpan.classList.add(className);
            td.appendChild(emojiSpan);
        }
    }

    // Clean up emoji elements from table cells
    function cleanEmoji(td) {
        const existingEmojis = td.querySelectorAll('.duplicate-emoji-red, .duplicate-emoji-green');
        existingEmojis.forEach(emoji => emoji.remove());
    }

    function handleVisibilityChange() {
        if (document.visibilityState === 'visible') {
            detectAndHighlightDuplicates();
            highlightRows();
        }
    }
// Function to count matching "Planifiée" rows
function countMatchingRows() {
    const tbody = document.querySelector('tbody.MuiTableBody-root.datagrid-body.jss80');
    if (!tbody) return 0;

    const rows = tbody.querySelectorAll('tr');
    return Array.from(rows).filter(tr => {
        const livreurStatusCell = tr.querySelector('td.column-livreur_status span');
        const typeCell = tr.querySelector('td.column-type span');

        return (
            (livreurStatusCell?.textContent.trim() === 'En recherche' &&
             typeCell?.textContent.trim() === 'Planifiée') ||
            (livreurStatusCell?.textContent.trim() === 'Acceptée' &&
             typeCell?.textContent.trim() === 'Planifiée')
        );
    }).length;
}

// Function to get "Planifiée" rows and format the results
function getPlanifieResults() {
    const tbody = document.querySelector('tbody.MuiTableBody-root.datagrid-body.jss80');
    const results = [];
    if (!tbody) return results;

    const rows = tbody.querySelectorAll('tr');
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
                results.push({
                    collectPoint: collectPointCell.textContent.trim(),
                    orderId: orderIdCell.textContent.trim(),
                    orderDate: orderDateCell.textContent.trim(),
                });
            }
        }
    });
    return results;
}

// Function to create a formatted table in a form
function createPlanifieResultsForm() {
    // Remove any existing form to avoid duplication
    const existingForm = document.getElementById('planifie-results-form');
    if (existingForm) {
        existingForm.remove();
    }

    const targetForm = document.querySelector('form.jss55.jss56');
    if (!targetForm) return;

    const nextSibling = targetForm.nextElementSibling;
    if (!nextSibling || nextSibling.tagName !== 'SPAN') return;

    // Create a new form
    const newForm = document.createElement('form');
    newForm.id = 'planifie-results-form';
    newForm.className = 'MuiToolbar-root MuiToolbar-regular jss52 MuiToolbar-gutters';
    newForm.style.border = '2px dashed rgb(0, 123, 255)';
    newForm.style.padding = '20px';
    newForm.style.margin = '10px';
    newForm.style.borderRadius = '8px';
    newForm.style.backgroundColor = 'rgb(249, 249, 249)';
    newForm.style.fontFamily = 'Arial, sans-serif';
    newForm.style.fontSize = '16px';

    targetForm.parentNode.insertBefore(newForm, nextSibling);

    // Add the count
    const count = countMatchingRows();
    const results = getPlanifieResults();

    const countDiv = document.createElement('div');
    countDiv.style.marginTop = '15px';
    countDiv.style.fontSize = '1.5em';
    countDiv.style.fontWeight = '600';
    countDiv.innerHTML = `<span>Planifie: </span><span style="color: rgb(0, 123, 255);">${count}</span>`;
    newForm.appendChild(countDiv);

    // Create a table for results
    if (results.length > 0) {
        const table = document.createElement('table');
        table.style.width = '100%';
        table.style.borderCollapse = 'collapse';
        table.style.marginTop = '10px';

        // Table Header
        const headerRow = document.createElement('tr');
        ['Collect Point', 'Order ID', 'Order Date'].forEach(headerText => {
            const th = document.createElement('th');
            th.textContent = headerText;
            th.style.border = '1px solid #ddd';
            th.style.padding = '8px';
            th.style.backgroundColor = 'rgb(0, 123, 255)';
            th.style.color = '#fff';
            headerRow.appendChild(th);
        });
        table.appendChild(headerRow);

        // Table Body
        results.forEach(row => {
            const tr = document.createElement('tr');
            Object.values(row).forEach(text => {
                const td = document.createElement('td');
                td.textContent = text;
                td.style.border = '1px solid #ddd';
                td.style.padding = '8px';
                tr.appendChild(td);
            });
            table.appendChild(tr);
        });

        newForm.appendChild(table);
    } else {
        const noDataDiv = document.createElement('div');
        noDataDiv.textContent = 'No matching rows found.';
        noDataDiv.style.color = 'red';
        noDataDiv.style.marginTop = '10px';
        newForm.appendChild(noDataDiv);
    }
}

// Call the function to display results
window.addEventListener('load', () => {
    createPlanifieResultsForm();
    setInterval(() => {
        createPlanifieResultsForm(); // Refresh results every 10 seconds
    }, 1000);
});


    
    // Initialize everything when the page is loaded
    window.addEventListener('load', () => {
        initializeObserver();

        // Create and insert the new form between <form class="jss55 jss56"> and <span>
        createNewFormBetween();

        document.addEventListener('visibilitychange', handleVisibilityChange);
    });

})();
