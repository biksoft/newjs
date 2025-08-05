(() => {
    'use strict';

    // This observer will watch for changes on the page and re-apply styling.
    let observer;

    /**
     * This is the main function for ALL row styling. It is called every time the page updates.
     * It handles both the pink color for "Planifiée" and all other status colors.
     */
    function applyAllRowStyles() {
        const rows = document.querySelectorAll(
            'tr[resource="orders"], tr[resource="partnerOrders"], tr[resource="supermarket-orders"]'
        );

        rows.forEach(row => {
            // Reset background color first to handle status changes correctly
            row.style.backgroundColor = '';

            // Get the text content from the relevant cells
            const typeCellSpan = row.querySelector('td.column-type span');
            const clientStatus = row.querySelector('td.column-client_status span')?.textContent.trim();
            const orderStatus = row.querySelector('td.column-status span')?.textContent.trim();

            // --- PRIORITY RULE: Color "Planifiée" rows first ---
            if (typeCellSpan && typeCellSpan.textContent.trim() === 'Planifiée') {
                row.style.backgroundColor = '#fc93d0'; // Your pink color
            
            // --- General Status Rules ---
            } else if (clientStatus === 'Déposée' || orderStatus === 'Déposée') {
                row.style.backgroundColor = '#42ff79';
            } else if (clientStatus === 'En attente de paiement' || orderStatus === 'En recherche') {
                row.style.backgroundColor = '#ffeb42';
            } else if (clientStatus === 'En préparation' || orderStatus === 'En recherche') {
                row.style.backgroundColor = '#ffeb42';
            } else if (clientStatus === 'Acceptée' || orderStatus === 'En recherche') {
                row.style.backgroundColor = '#e7e6e6';
            } else if (clientStatus === 'Acceptée' || orderStatus === 'Acceptée') {
                row.style.backgroundColor = '#ffeb42';
            } else if (clientStatus === 'Livreur en route' || orderStatus === 'Récupérée') {
                row.style.backgroundColor = '#5b9bd5';
            } else if (clientStatus === 'Récupérée' || orderStatus === 'Récupérée') {
                row.style.backgroundColor = '#5b9bd5';
            } else if (clientStatus === 'Prête' || orderStatus === 'Acceptée') {
                row.style.backgroundColor = '#5b9bd5';
            } else if (clientStatus === 'Annulée' || orderStatus === 'Annulée') {
                row.style.backgroundColor = '#ff4242';
            } else if (clientStatus === 'Expirée' || orderStatus === 'Expirée') {
                row.style.backgroundColor = '#ff4242';
            }
        });
    }

    /**
     * Detects and highlights duplicate entries in the table.
     */
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
            if (tds.length > 1) {
                tds.forEach((td, index) => {
                    cleanEmoji(td);
                    const emoji = (index === tds.length - 1) ? '✅' : '🔴';
                    const className = (index === tds.length - 1) ? 'duplicate-emoji-green' : 'duplicate-emoji-red';
                    addEmoji(td, emoji, className);
                });
            } else {
                tds.forEach(td => cleanEmoji(td));
            }
        });

        if (observer) observer.observe(document.body, { childList: true, subtree: true });
    }

    /**
     * Adds an emoji span to a table cell.
     */
    function addEmoji(td, emoji, className) {
        if (!td.querySelector(`.${className}`)) {
            const emojiSpan = document.createElement('span');
            emojiSpan.textContent = emoji;
            emojiSpan.classList.add(className);
            td.appendChild(emojiSpan);
        }
    }

    /**
     * Removes emoji spans from a table cell.
     */
    function cleanEmoji(td) {
        const existingEmojis = td.querySelectorAll('.duplicate-emoji-red, .duplicate-emoji-green');
        existingEmojis.forEach(emoji => emoji.remove());
    }

    /**
     * Counts rows that are "Planifiée" and have a specific driver status.
     */
    function countMatchingPlanifie() {
        const tbody = document.querySelector('tbody.MuiTableBody-root.datagrid-body.jss80');
        if (!tbody) return 0;

        const rows = tbody.querySelectorAll('tr');
        return Array.from(rows).filter(tr => {
            const livreurStatusCell = tr.querySelector('td.column-livreur_status span');
            const typeCell = tr.querySelector('td.column-type span');
            return typeCell?.textContent.trim() === 'Planifiée' &&
                   (livreurStatusCell?.textContent.trim() === 'En recherche' || livreurStatusCell?.textContent.trim() === 'Acceptée');
        }).length;
    }

    /**
     * Gathers details from the "Planifiée" rows for the results table.
     */
    function getPlanifieResults() {
        const tbody = document.querySelector('tbody.MuiTableBody-root.datagrid-body.jss80');
        const results = [];
        if (!tbody) return results;

        const rows = tbody.querySelectorAll('tr');
        rows.forEach(tr => {
            const livreurStatusCell = tr.querySelector('td.column-livreur_status span');
            const typeCell = tr.querySelector('td.column-type span');

            if (typeCell?.textContent.trim() === 'Planifiée' && (livreurStatusCell?.textContent.trim() === 'En recherche' || livreurStatusCell?.textContent.trim() === 'Acceptée')) {
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

    /**
     * Creates or updates the form that displays the "Planifiée" count and results table.
     */
    function createOrUpdatePlanifieForm() {
        const existingInfoForm = document.getElementById('planifie-results-form');
        if (existingInfoForm) {
            existingInfoForm.remove();
        }

        const targetForm = document.querySelector('form.jss55.jss56');
        const nextSibling = targetForm?.nextElementSibling;
        if (!targetForm || !nextSibling || nextSibling.tagName !== 'SPAN') {
            console.error("Target location for the info form not found.");
            return;
        }

        const newForm = document.createElement('form');
        newForm.id = 'planifie-results-form';
        newForm.className = 'MuiToolbar-root MuiToolbar-regular jss52 MuiToolbar-gutters';
        Object.assign(newForm.style, {
            border: '2px dashed #007bff', padding: '20px', margin: '10px',
            borderRadius: '8px', backgroundColor: '#f9f9f9', fontFamily: 'Arial, sans-serif'
        });

        const count = countMatchingPlanifie();
        const results = getPlanifieResults();

        const countDiv = document.createElement('div');
        countDiv.style.cssText = 'margin-top: 15px; font-size: 1.5em; font-weight: 600;';
        countDiv.innerHTML = `<span>Planifie: </span><span style="color: #007bff;">${count}</span>`;
        newForm.appendChild(countDiv);

        if (results.length > 0) {
            const table = document.createElement('table');
            table.style.cssText = 'width: 100%; border-collapse: collapse; margin-top: 10px;';
            const headerRow = table.insertRow();
            ['Collect Point', 'Order ID', 'Date Commande'].forEach(headerText => {
                const th = document.createElement('th');
                th.textContent = headerText;
                th.style.cssText = 'border: 1px solid #ddd; padding: 8px; background-color: #007bff; color: white;';
                headerRow.appendChild(th);
            });

            results.forEach(rowData => {
                const row = table.insertRow();
                Object.values(rowData).forEach(text => {
                    const cell = row.insertCell();
                    cell.textContent = text;
                    cell.style.cssText = 'border: 1px solid #ddd; padding: 8px;';
                });
            });
            newForm.appendChild(table);
        } else {
            const noDataDiv = document.createElement('div');
            noDataDiv.textContent = 'Aucune commande planifiée à afficher.';
            noDataDiv.style.cssText = 'color: red; margin-top: 10px;';
            newForm.appendChild(noDataDiv);
        }

        targetForm.parentNode.insertBefore(newForm, nextSibling);
    }

    /**
     * Initializes the MutationObserver to watch for page changes.
     */
    function initializeObserver() {
        observer = new MutationObserver(() => {
            // When the page changes, re-run all styling and detection functions
            applyAllRowStyles();
            detectAndHighlightDuplicates();
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }

    // --- SCRIPT EXECUTION ---
    console.log("🚀 Custom script running...");

    // Initial setup when script is first run
    initializeObserver();
    createOrUpdatePlanifieForm();
    applyAllRowStyles();
    detectAndHighlightDuplicates();

    // Set an interval to refresh the "Planifiée" results form periodically
    setInterval(createOrUpdatePlanifieForm, 2000); // Refreshes every 2 seconds

})();
