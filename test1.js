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
            updatePlanifieResults(); // Refresh Planifie results every 10 seconds
        }, 10000);

        // Initialize the Planifie results right away
        updatePlanifieResults();
    }

    // Function to update the Planifie results
    function updatePlanifieResults() {
        // Find the form to insert the result into
        const form = document.querySelector('form.MuiToolbar-root.MuiToolbar-regular.jss52.MuiToolbar-gutters');
        if (!form) {
            console.error('The form to insert the Planifie results was not found.');
            return;
        }

        // Find all rows with the "Planifiée" status
        const tbody = document.querySelector('tbody.MuiTableBody-root.datagrid-body.jss80');
        const rows = Array.from(tbody.querySelectorAll('tr'));

        // Filter rows for "Planifiée" (based on livreurStatus and type)
        const planifieRows = rows.filter(tr => {
            const livreurStatusCell = tr.querySelector('td.column-livreur_status span');
            const typeCell = tr.querySelector('td.column-type span');

            return (
                (livreurStatusCell?.textContent.trim() === 'En recherche' &&
                typeCell?.textContent.trim() === 'Planifiée') ||
                (livreurStatusCell?.textContent.trim() === 'Acceptée' &&
                typeCell?.textContent.trim() === 'Planifiée')
            );
        });

        // Prepare the formatted result for each matching row
        let resultsHtml = '';
        planifieRows.forEach(row => {
            const collectPoint = row.querySelector('td.column-collect_point.name span')?.textContent.trim();
            const orderId = row.querySelector('td.column-order_id span')?.textContent.trim();
            const orderDate = row.querySelector('td.column-order_date span')?.textContent.trim();

            // Create the formatted result string
            if (collectPoint && orderId && orderDate) {
                resultsHtml += `${collectPoint} [${orderId}] : ${orderDate}<br>`;
            }
        });

        // Create or update the Planifie results section in the form
        const planifieResultsDiv = form.querySelector('.planifie-results');
        if (!planifieResultsDiv) {
            const newDiv = document.createElement('div');
            newDiv.className = 'planifie-results';
            newDiv.innerHTML = resultsHtml;
            form.appendChild(newDiv);
        } else {
            planifieResultsDiv.innerHTML = resultsHtml; // Update if it already exists
        }
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

    function addEmoji(td, emoji, className) {
        if (!td.querySelector(`.${className}`)) {
            const emojiSpan = document.createElement('span');
            emojiSpan.textContent = emoji;
            emojiSpan.classList.add(className);
            td.appendChild(emojiSpan);
        }
    }

    function cleanEmoji(td) {
        const existingEmojis = td.querySelectorAll('.duplicate-emoji-red, .duplicate-emoji-green');
        existingEmojis.forEach(emoji => emoji.remove());
    }

    // Initialize the observer and other necessary functions
    setInterval(() => {
        if (Date.now() - lastUpdateTimestamp > 500) {
            detectAndHighlightDuplicates();
            highlightRows();
        }
    }, 500);

    window.addEventListener('load', () => {
        initializeObserver();
        createNewFormBetween();
        document.addEventListener('visibilitychange', handleVisibilityChange);
    });

})();
