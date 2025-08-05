(() => {
    'use strict';

    let observer;

    /**
     * ===================================================================
     * DATA & LOGIC FUNCTIONS
     * ===================================================================
     */

    // NEW: Gets full details for matching "Planifiée" orders.
    function getPlanifieDetails() {
        const rows = document.querySelectorAll('tbody.MuiTableBody-root tr');
        const details = [];
        for (const tr of rows) {
            const livreurStatusCell = tr.querySelector('td.column-livreur_status span');
            const typeCell = tr.querySelector('td.column-type span');

            if (typeCell?.textContent.trim() === 'Planifiée') {
                const livreurStatus = livreurStatusCell?.textContent.trim();
                if (livreurStatus === 'En recherche' || livreurStatus === 'Acceptée') {
                    // This row matches, so we extract its details.
                    const orderId = tr.querySelector('td.column-order_id span')?.textContent.trim() || 'N/A';
                    const orderDate = tr.querySelector('td.column-order_date span')?.textContent.trim() || 'N/A';
                    const collectPoint = tr.querySelector('td.column-collect_point\\.name span')?.textContent.trim() || 'N/A';
                    details.push({
                        orderId,
                        orderDate,
                        collectPoint
                    });
                }
            }
        }
        return details;
    }

    // Consolidated function to highlight all rows.
    function highlightRows() {
        const rows = document.querySelectorAll(
            'tr[resource="orders"], tr[resource="partnerOrders"], tr[resource="supermarket-orders"]'
        );
        rows.forEach(row => {
            const clientStatus = row.querySelector('td.column-client_status span')?.textContent.trim();
            const orderStatus = row.querySelector('td.column-status span')?.textContent.trim();
            const typeStatus = row.querySelector('td.column-type span')?.textContent.trim();

            row.style.backgroundColor = ''; // Reset color first

            // Apply new color based on priority
            if (typeStatus === 'Planifiée') {
                row.style.backgroundColor = '#fc93d0';
            } else if (clientStatus === 'Annulée' || orderStatus === 'Annulée' || clientStatus === 'Expirée' || orderStatus === 'Expirée') {
                row.style.backgroundColor = '#ff4242';
            } else if (clientStatus === 'Déposée' || orderStatus === 'Déposée') {
                row.style.backgroundColor = '#42ff79';
            } else if (clientStatus === 'Livreur en route' || orderStatus === 'Récupérée' || clientStatus === 'Récupérée' || (clientStatus === 'Prête' && orderStatus === 'Acceptée')) {
                row.style.backgroundColor = '#5b9bd5';
            } else if (clientStatus === 'En attente de paiement' || clientStatus === 'En préparation' || orderStatus === 'En recherche') {
                row.style.backgroundColor = '#ffeb42';
            } else if (clientStatus === 'Acceptée' || orderStatus === 'Acceptée') {
                row.style.backgroundColor = '#e7e6e6';
            }
        });
    }


    /**
     * ===================================================================
     * UNCHANGED CODE YOU WANTED TO KEEP
     * ===================================================================
     */

    // Detect and highlight duplicate entries in the table.
    function detectAndHighlightDuplicates() {
        if (observer) observer.disconnect();
        const tdElements = document.querySelectorAll('td.column-order_id span, td.column-code span');
        const values = Array.from(tdElements).map(span => ({ value: span.textContent.trim(), td: span.closest('td') }));
        const valueCounts = {};
        values.forEach(({ value, td }) => {
            if (!valueCounts[value]) { valueCounts[value] = { tds: [] }; }
            valueCounts[value].tds.push(td);
        });
        Object.keys(valueCounts).forEach(value => {
            const { tds } = valueCounts[value];
            if (tds.length > 1) {
                tds.forEach((td, index) => {
                    cleanEmoji(td);
                    const isLast = index === tds.length - 1;
                    addEmoji(td, isLast ? '✅' : '🔴', isLast ? 'duplicate-emoji-green' : 'duplicate-emoji-red');
                });
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
        td.querySelectorAll('.duplicate-emoji-red, .duplicate-emoji-green').forEach(emoji => emoji.remove());
    }


    /**
     * ===================================================================
     * MAIN DISPLAY & UPDATE FUNCTIONS
     * ===================================================================
     */

    // UPDATED: This function now creates the full table, not just a count.
    function createOrUpdatePlanifieTable() {
        const targetForm = document.querySelector('form.jss55.jss56');
        if (!targetForm) return; // Exit if the page isn't ready

        const nextSibling = targetForm.nextElementSibling;
        if (!nextSibling || nextSibling.tagName !== 'SPAN') return;

        // Remove the old table to prevent duplicates on update
        const oldDisplay = document.getElementById('planifie-details-display');
        if (oldDisplay) oldDisplay.remove();

        const planifieDetails = getPlanifieDetails();

        const newDisplay = document.createElement('div');
        newDisplay.id = 'planifie-details-display';
        newDisplay.style.border = '2px dashed #007bff';
        newDisplay.style.padding = '20px';
        newDisplay.style.margin = '10px';
        newDisplay.style.borderRadius = '8px';

        let contentHTML = `
            <div style="font-size: 1.5em; font-weight: 600; color: #333; margin-bottom: 15px;">
                Planifié: <span style="font-weight: bold; color: #007bff;">${planifieDetails.length}</span>
            </div>`;

        if (planifieDetails.length > 0) {
            const tableRows = planifieDetails.map(item => `
                <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 8px;">${item.collectPoint}</td>
                    <td style="padding: 8px;">${item.orderId}</td>
                    <td style="padding: 8px;">${item.orderDate}</td>
                </tr>
            `).join('');

            contentHTML += `
                <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                    <thead>
                        <tr style="text-align: left; background-color: #f2f2f2;">
                            <th style="padding: 8px;">Point de Collecte</th>
                            <th style="padding: 8px;">ID Commande</th>
                            <th style="padding: 8px;">Date Commande</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows}
                    </tbody>
                </table>`;
        } else {
            contentHTML += `<div>Aucune commande planifiée à afficher.</div>`;
        }

        newDisplay.innerHTML = contentHTML;
        targetForm.parentNode.insertBefore(newDisplay, nextSibling);
    }

    // This is the single function that runs all updates.
    function runAllUpdates() {
        highlightRows();
        detectAndHighlightDuplicates();
        createOrUpdatePlanifieTable(); // This now creates the table
    }


    /**
     * ===================================================================
     * INITIALIZATION
     * ===================================================================
     */

    function initialize() {
        // Set up the observer to call the main update function.
        observer = new MutationObserver(runAllUpdates);
        observer.observe(document.body, { childList: true, subtree: true });

        // Run all updates once when the script loads.
        runAllUpdates();

        // Also run updates if you switch back to the tab.
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                runAllUpdates();
            }
        });

        // Add a fallback timer to refresh every 30 seconds just in case.
        setInterval(runAllUpdates, 30000);
    }

    window.addEventListener('load', initialize);

})();
