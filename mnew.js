(() => {
    'use strict';

    // A simple debounce function to prevent rapid-fire execution
    function debounce(func, delay) {
        let timeoutId;
        return function(...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                func.apply(this, args);
            }, delay);
        };
    }

    /**
     * ===================================================================
     * STYLING INJECTION
     * ===================================================================
     * Using CSS classes is much more efficient than setting inline styles.
     * The browser can optimize rendering, and the JS code is cleaner.
     */
    function injectStyles() {
        const style = document.createElement('style');
        style.textContent = `
            /* Row Highlighting */
            .highlight-deposee     { background-color: #42ff79 !important; }
            .highlight-attente     { background-color: #ffeb42 !important; }
            .highlight-acceptee    { background-color: #e7e6e6 !important; }
            .highlight-recuperee   { background-color: #5b9bd5 !important; }
            .highlight-annulee     { background-color: #ff4242 !important; }
            .highlight-planifiee   { background-color: #fc93d0 !important; }

            /* Duplicate Emojis */
            .duplicate-emoji-red, .duplicate-emoji-green { margin-left: 8px; }

            /* "Planifiée" Results Form */
            #planifie-results-form {
                border: 2px dashed #007bff;
                padding: 20px;
                margin: 10px 0;
                border-radius: 8px;
                background-color: #f9f9f9;
                font-family: Arial, sans-serif;
            }
            #planifie-results-form .planifie-header {
                font-size: 1.5em;
                font-weight: 600;
                margin-bottom: 15px;
            }
            #planifie-results-form .planifie-count {
                color: #007bff;
                font-weight: bold;
            }
            #planifie-results-form .planifie-table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 10px;
            }
            #planifie-results-form .planifie-table th,
            #planifie-results-form .planifie-table td {
                border: 1px solid #ddd;
                padding: 8px;
                text-align: left;
            }
            #planifie-results-form .planifie-table th {
                background-color: #007bff;
                color: white;
            }
            #planifie-results-form .no-results {
                color: red;
                margin-top: 10px;
            }
        `;
        document.head.appendChild(style);
    }


    /**
     * ===================================================================
     * CORE LOGIC & DOM MANIPULATION
     * ===================================================================
     */

    // Gets all relevant data from "Planifiée" rows in a single pass.
    function getPlanifieData() {
        const rows = document.querySelectorAll('tbody.MuiTableBody-root tr');
        const results = [];

        for (const tr of rows) {
            const typeCell = tr.querySelector('td.column-type span');
            if (typeCell?.textContent.trim() !== 'Planifiée') continue;

            // This row is "Planifiée", so highlight it
            tr.classList.add('highlight-planifiee');

            const livreurStatusCell = tr.querySelector('td.column-livreur_status span');
            const livreurStatus = livreurStatusCell?.textContent.trim();

            if (livreurStatus === 'En recherche' || livreurStatus === 'Acceptée') {
                const collectPointCell = tr.querySelector('td.column-collect_point\\.name span');
                const orderIdCell = tr.querySelector('td.column-order_id span');
                const orderDateCell = tr.querySelector('td.column-order_date span');

                results.push({
                    collectPoint: collectPointCell?.textContent.trim() || 'N/A',
                    orderId: orderIdCell?.textContent.trim() || 'N/A',
                    orderDate: orderDateCell?.textContent.trim() || 'N/A',
                });
            }
        }
        return results;
    }

    // Creates or updates the "Planifiée" results display without rebuilding the entire form each time.
    function createOrUpdatePlanifieDisplay(planifieResults) {
        const targetForm = document.querySelector('form.jss55.jss56');
        if (!targetForm) return;

        let formContainer = document.getElementById('planifie-results-form');
        // Create the form only if it doesn't exist
        if (!formContainer) {
            formContainer = document.createElement('form');
            formContainer.id = 'planifie-results-form';
            formContainer.innerHTML = `
                <div class="planifie-header">
                    <span>Planifié: </span><span class="planifie-count">0</span>
                </div>
                <div class="table-container"></div>
            `;
            // Insert the new form right after the target form
            targetForm.parentNode.insertBefore(formContainer, targetForm.nextSibling);
        }

        // Update the count
        const countSpan = formContainer.querySelector('.planifie-count');
        countSpan.textContent = planifieResults.length;

        // Update the table
        const tableContainer = formContainer.querySelector('.table-container');
        if (planifieResults.length > 0) {
            const tableRows = planifieResults.map(row => `
                <tr>
                    <td>${row.collectPoint}</td>
                    <td>${row.orderId}</td>
                    <td>${row.orderDate}</td>
                </tr>
            `).join('');

            tableContainer.innerHTML = `
                <table class="planifie-table">
                    <thead>
                        <tr>
                            <th>Collect Point</th>
                            <th>Order ID</th>
                            <th>Date Commande</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows}
                    </tbody>
                </table>
            `;
        } else {
            tableContainer.innerHTML = `<div class="no-results">Aucune commande planifiée.</div>`;
        }
    }

    // Highlights rows based on their status using CSS classes.
    function highlightRowsByStatus() {
        const rows = document.querySelectorAll('tr[resource]');
        const statusMap = {
            'Déposée': 'highlight-deposee',
            'En attente de paiement': 'highlight-attente',
            'En préparation': 'highlight-attente',
            'En recherche': 'highlight-attente',
            'Acceptée': 'highlight-acceptee',
            'Livreur en route': 'highlight-recuperee',
            'Récupérée': 'highlight-recuperee',
            'Prête': 'highlight-recuperee',
            'Annulée': 'highlight-annulee',
            'Expirée': 'highlight-annulee'
        };

        rows.forEach(row => {
            // Clear previous highlights to handle status changes
            row.className = row.className.replace(/highlight-\w+/g, '').trim();

            const clientStatus = row.querySelector('td.column-client_status span')?.textContent.trim();
            const orderStatus = row.querySelector('td.column-status span')?.textContent.trim();

            if (statusMap[clientStatus]) {
                row.classList.add(statusMap[clientStatus]);
            } else if (statusMap[orderStatus]) {
                row.classList.add(statusMap[orderStatus]);
            }
        });
    }

    // Detects and highlights duplicate order IDs.
    function highlightDuplicates() {
        const valueMap = new Map();
        const cells = document.querySelectorAll('td.column-order_id span, td.column-code span');

        // First pass: collect all cells by their value
        cells.forEach(span => {
            const value = span.textContent.trim();
            const td = span.closest('td');
            if (!td) return;
            
            // Clean old emojis first
            td.querySelectorAll('.duplicate-emoji-red, .duplicate-emoji-green').forEach(e => e.remove());

            if (!valueMap.has(value)) {
                valueMap.set(value, []);
            }
            valueMap.get(value).push(td);
        });

        // Second pass: apply emojis to duplicates
        for (const [value, tds] of valueMap.entries()) {
            if (tds.length > 1) {
                tds.forEach((td, index) => {
                    const isLast = index === tds.length - 1;
                    const emojiSpan = document.createElement('span');
                    emojiSpan.textContent = isLast ? '✅' : '🔴';
                    emojiSpan.className = isLast ? 'duplicate-emoji-green' : 'duplicate-emoji-red';
                    td.appendChild(emojiSpan);
                });
            }
        }
    }

    /**
     * ===================================================================
     * INITIALIZATION & EVENTS
     * ===================================================================
     */

    // This is the main function that runs all updates.
    function runAllUpdates() {
        // Run status highlighting first
        highlightRowsByStatus();
        
        // This function now also handles highlighting "Planifiée" rows
        const planifieResults = getPlanifieData();
        createOrUpdatePlanifieDisplay(planifieResults);

        // Run duplicate detection last
        highlightDuplicates();
    }

    // Debounced version for the MutationObserver to avoid excessive calls
    const debouncedUpdates = debounce(runAllUpdates, 300);

    function initialize() {
        // Add all our styles to the page
        injectStyles();

        // Run updates once on load
        runAllUpdates();

        // Set up a less aggressive interval as a fallback to catch any changes.
        // 5-10 seconds is usually sufficient and much better than 1 second.
        setInterval(runAllUpdates, 10000);

        // Observe only the table body for changes. This is FAR more efficient
        // than observing the entire document body.
        const tableBody = document.querySelector('tbody.MuiTableBody-root');
        if (tableBody) {
            const observer = new MutationObserver((mutations) => {
                // We only care if rows (TR elements) were added or removed.
                const hasRelevantChanges = mutations.some(m => 
                    Array.from(m.addedNodes).some(n => n.tagName === 'TR') ||
                    Array.from(m.removedNodes).some(n => n.tagName === 'TR')
                );

                if (hasRelevantChanges) {
                    debouncedUpdates();
                }
            });
            observer.observe(tableBody, {
                childList: true
            });
        }

        // Re-run updates when the tab becomes visible again
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                runAllUpdates();
            }
        });
    }
    
    // Use DOMContentLoaded which fires earlier than 'load'
    window.addEventListener('DOMContentLoaded', initialize);

})();
