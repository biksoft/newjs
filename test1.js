(() => {
    'use strict';

    let observer;
    let lastUpdateTimestamp = Date.now();

    // Function to count rows matching the specified conditions
    function countMatchingRows() {
        const tbody = document.querySelector('tbody.MuiTableBody-root.datagrid-body.jss80');
        if (!tbody) {
            console.error('Table body not found');
            return 0;
        }

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
        if (!existingForm) {
            console.error('Form not found: form.jss55.jss56');
            return;
        }

        const nextSibling = existingForm.nextElementSibling;
        if (!nextSibling || nextSibling.tagName !== 'SPAN') {
            console.error('No <span> element found after form.');
            return;
        }

        // Create the new form element
        const newForm = document.createElement('form');
        newForm.className = 'MuiToolbar-root MuiToolbar-regular jss52 MuiToolbar-gutters';
        styleForm(newForm);

        // Create a new div to contain the "Planifie" field
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

        newForm.appendChild(fieldDiv);
        existingForm.parentNode.insertBefore(newForm, nextSibling);

        // Refresh the count every 10 seconds
        setInterval(() => {
            countSpan.textContent = countMatchingRows();
            updatePlanifieResults(); // Refresh results every 10 seconds
        }, 10000);

        // Initialize Planifie results immediately
        updatePlanifieResults();
    }

    // Function to update the "Planifie" results
    function updatePlanifieResults() {
        const form = document.querySelector('form.MuiToolbar-root.MuiToolbar-regular.jss52.MuiToolbar-gutters');
        if (!form) {
            console.error('Form not found for Planifie results');
            return;
        }

        const tbody = document.querySelector('tbody.MuiTableBody-root.datagrid-body.jss80');
        const rows = Array.from(tbody.querySelectorAll('tr'));

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

        let resultsHtml = '';
        planifieRows.forEach(row => {
            const collectPoint = row.querySelector('td.column-collect_point.name span')?.textContent.trim();
            const orderId = row.querySelector('td.column-order_id span')?.textContent.trim();
            const orderDate = row.querySelector('td.column-order_date span')?.textContent.trim();

            if (collectPoint && orderId && orderDate) {
                resultsHtml += `${collectPoint} [${orderId}] : ${orderDate}<br>`;
            }
        });

        const planifieResultsDiv = form.querySelector('.planifie-results');
        if (!planifieResultsDiv) {
            const newDiv = document.createElement('div');
            newDiv.className = 'planifie-results';
            newDiv.innerHTML = resultsHtml;
            form.appendChild(newDiv);
        } else {
            planifieResultsDiv.innerHTML = resultsHtml;
        }
    }

    // Initialize the observer and necessary functions
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
        const rows = document.querySelectorAll('tr[resource="orders"], tr[resource="partnerOrders"]');
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

    // Function to detect and highlight duplicates
    function detectAndHighlightDuplicates() {
        if (observer) observer.disconnect();

        const tdElements = document.querySelectorAll('td.column-order_id span, td.column-code span');
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

    // Function to add emoji to a table cell
    function addEmoji(td, emoji, className) {
        if (!td.querySelector(`.${className}`)) {
            const emojiSpan = document.createElement('span');
            emojiSpan.textContent = emoji;
            emojiSpan.classList.add(className);
            td.appendChild(emojiSpan);
        }
    }

    // Function to clean emoji from a table cell
    function cleanEmoji(td) {
        const existingEmojis = td.querySelectorAll('.duplicate-emoji-red, .duplicate-emoji-green');
        existingEmojis.forEach(emoji => emoji.remove());
    }

    // Initialize the script when the document is ready
    window.addEventListener('load', () => {
        initializeObserver();
        createNewFormBetween();  // Create the new form and results
        document.addEventListener('visibilitychange', handleVisibilityChange);
    });
})();
