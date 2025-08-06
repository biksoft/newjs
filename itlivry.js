(() => {
    'use strict';

    // Global variables to hold the observer and interval ID
    let observer = null;
    let refreshIntervalId = null;

    /**
     * This is the core function of the script.
     * It checks if the "Planifiée" table should be on the page and creates it if needed.
     */
    function initializeOrRefreshView() {
        const targetForm = document.querySelector('form.jss55.jss56');
        if (!targetForm) {
            return;
        }

        if (document.getElementById('planifie-results-form')) {
            return;
        }

        console.log("🚀 Correct page detected. Creating 'Planifiée' orders view...");

        createOrUpdatePlanifieForm();
        applyAllRowStyles();
        detectAndHighlightDuplicates();
        initializeObserver();

        if (refreshIntervalId) {
            clearInterval(refreshIntervalId);
        }
        refreshIntervalId = setInterval(createOrUpdatePlanifieForm, 2000);
    }


    // --- All Helper Functions Below ---

    /**
     * Applies color styles to rows based on their type and status.
     */
    function applyAllRowStyles() {
        const rows = document.querySelectorAll(
            'tr[resource="orders"], tr[resource="partnerOrders"], tr[resource="supermarket-orders"]'
        );
        rows.forEach(row => {
            row.style.backgroundColor = ''; // Reset background first

            const typeCellSpan = row.querySelector('td.column-type span');
            const type = typeCellSpan?.textContent.trim();
            const clientStatus = row.querySelector('td.column-client_status span')?.textContent.trim();
            const orderStatus = row.querySelector('td.column-status span')?.textContent.trim();

            if (type === 'Planifiée') {
                 if (clientStatus === 'Acceptée' && orderStatus === 'En recherche') {
                    row.style.backgroundColor = '#fc93d0';
                } else if (clientStatus === 'Récupérée' || orderStatus === 'Récupérée') {
                    row.style.backgroundColor = '#5b9bd5';
                } else if (clientStatus === 'Déposée' || orderStatus === 'Déposée') {
                    row.style.backgroundColor = '#42ff79';
                } else if (clientStatus === 'Expirée' || orderStatus === 'Expirée') {
                    row.style.backgroundColor = '#ff4242';
                } else {
                    row.style.backgroundColor = '#fc93d0';
                }
            } else {
                if (clientStatus === 'Déposée' || orderStatus === 'Déposée') {
                    row.style.backgroundColor = '#42ff79';
                } else if (clientStatus === 'Récupérée' || orderStatus === 'Récupérée' || clientStatus === 'Livreur en route' || clientStatus === 'Prête') {
                    row.style.backgroundColor = '#5b9bd5';
                } else if (clientStatus === 'Annulée' || orderStatus === 'Annulée' || clientStatus === 'Expirée' || orderStatus === 'Expirée') {
                    row.style.backgroundColor = '#ff4242';
                } else if (clientStatus === 'En attente de paiement' || clientStatus === 'En préparation' || orderStatus === 'Acceptée') {
                    row.style.backgroundColor = '#ffeb42';
                }
            }
        });
    }

    /**
     * Finds and marks duplicate order IDs with emojis.
     */
    function detectAndHighlightDuplicates() {
        if (observer) observer.disconnect();
        const tdElements = document.querySelectorAll('td.column-order_id span, td.column-code span');
        const values = Array.from(tdElements).map(span => ({ value: span.textContent.trim(), td: span.closest('td') }));
        const valueCounts = {};
        values.forEach(({ value, td }) => {
            if (!valueCounts[value]) valueCounts[value] = { tds: [] };
            valueCounts[value].tds.push(td);
        });
        Object.keys(valueCounts).forEach(value => {
            const { tds } = valueCounts[value];
            tds.forEach(td => cleanEmoji(td));
            if (tds.length > 1) {
                tds.forEach((td, index) => {
                    const isLast = index === tds.length - 1;
                    addEmoji(td, isLast ? '✅' : '🔴', isLast ? 'duplicate-emoji-green' : 'duplicate-emoji-red');
                });
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

    /**
     * ✅ UPDATED: Efficiently scans the table ONCE to get all "Planifiée" data.
     * @returns {{results: Array, count: number}} An object with the results array and the count.
     */
    function getPlanifieData() {
        const tbody = document.querySelector('tbody.MuiTableBody-root.datagrid-body.jss80');
        const planifieOrders = [];

        if (tbody) {
            const rows = tbody.querySelectorAll('tr');
            rows.forEach(tr => {
                const livreurStatusCell = tr.querySelector('td.column-livreur_status span');
                const typeCell = tr.querySelector('td.column-type span');

                if (typeCell?.textContent.trim() === 'Planifiée' && (livreurStatusCell?.textContent.trim() === 'En recherche' || livreurStatusCell?.textContent.trim() === 'Acceptée')) {
                    const collectPointCell = tr.querySelector('td.column-collect_point\\.name span');
                    const orderIdCell = tr.querySelector('td.column-order_id span');
                    const orderDateCell = tr.querySelector('td.column-order_date span');

                    if (collectPointCell && orderIdCell && orderDateCell) {
                        planifieOrders.push({
                            collectPoint: collectPointCell.textContent.trim(),
                            orderId: orderIdCell.textContent.trim(),
                            orderDate: orderDateCell.textContent.trim(),
                        });
                    }
                }
            });
        }

        return {
            results: planifieOrders,
            count: planifieOrders.length,
        };
    }

    /**
     * Creates or updates the custom form with the "Planifiée" order details.
     */
    function createOrUpdatePlanifieForm() {
        const existingInfoForm = document.getElementById('planifie-results-form');
        if (existingInfoForm) existingInfoForm.remove();

        const targetForm = document.querySelector('form.jss55.jss56');
        const nextSibling = targetForm?.nextElementSibling;
        if (!targetForm || !nextSibling || nextSibling.tagName !== 'SPAN') return;

        const newForm = document.createElement('form');
        newForm.id = 'planifie-results-form';
        Object.assign(newForm.style, { border: '2px dashed #007bff', padding: '20px', margin: '10px', borderRadius: '8px', backgroundColor: '#f9f9f9', fontFamily: 'Arial, sans-serif' });

        // ✅ UPDATED: Calls the new single, efficient function
        const planifieData = getPlanifieData();
        const count = planifieData.count;
        const results = planifieData.results;

        const countDiv = document.createElement('div');
        countDiv.style.cssText = 'margin-bottom: 15px; font-size: 1.5em; font-weight: 600;';
        countDiv.innerHTML = `<span>Planifie: </span><span style="color: #007bff;">${count}</span>`;
        newForm.appendChild(countDiv);

        if (results.length > 0) {
            const table = document.createElement('table');
            table.style.cssText = 'width: 100%; border-collapse: collapse;';
            const headerRow = table.insertRow();
            ['Collect Point', 'Order ID', 'Date Commande'].forEach(headerText => {
                const th = document.createElement('th');
                th.textContent = headerText;
                th.style.cssText = 'border: 1px solid #ddd; padding: 8px; background-color: #007bff; color: white; text-align: left;';
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
     * Initializes the observer to watch for page changes.
     */
    function initializeObserver() {
        if (observer) observer.disconnect();
        observer = new MutationObserver(() => {
            applyAllRowStyles();
            detectAndHighlightDuplicates();
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    // --- SCRIPT EXECUTION ---

    window.addEventListener('hashchange', initializeOrRefreshView);
    window.addEventListener('load', initializeOrRefreshView);
    setTimeout(initializeOrRefreshView, 500);

})();
