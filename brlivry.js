(function () {
    'use strict';

    // --- Global State ---
    let mainIntervalId = null;
    let observer = null;
    let isInitialized = false; 

    // --- Helper Functions ---

    /**
     * Applies color styles to rows based on their type and status.
     */
    function applyAllRowStyles() {
        // Targets rows in order tables
        const rows = document.querySelectorAll('tr[resource="orders"], tr[resource="partnerOrders"], tr[resource="supermarket-orders"]');
        
        rows.forEach(row => {
            row.style.backgroundColor = ''; 

            const type = row.querySelector('td.column-type span')?.textContent.trim();
            const clientStatus = row.querySelector('td.column-client_status span')?.textContent.trim();
            const orderStatus = row.querySelector('td.column-status span')?.textContent.trim();

            if (!type) return;

            let newColor = '';

            // Logic for 'Planifiée' orders
            if (type === 'Planifiée') {
                if (clientStatus === 'Acceptée' && orderStatus === 'En recherche') {
                    newColor = '#fc93d0';
                } else if (clientStatus === 'Récupérée' || orderStatus === 'Récupérée') {
                    newColor = '#5b9bd5';
                } else if (clientStatus === 'Déposée' || orderStatus === 'Déposée') {
                    newColor = '#42ff79';
                } else if (clientStatus === 'Expirée' || orderStatus === 'Expirée') {
                    newColor = '#ff4242';
                } else {
                    newColor = '#fc93d0';
                }
            } 
            // Logic for other order types
            else {
                if (clientStatus === 'Déposée' || orderStatus === 'Déposée') {
                    newColor = '#42ff79';
                } else if (clientStatus === 'Récupérée' || orderStatus === 'Récupérée' || clientStatus === 'Livreur en route' || clientStatus === 'Prête') {
                    newColor = '#5b9bd5';
                } else if (clientStatus === 'Annulée' || orderStatus === 'Annulée' || clientStatus === 'Expirée' || orderStatus === 'Expirée') {
                    newColor = '#ff4242';
                } else if (clientStatus === 'En attente de paiement' || clientStatus === 'En préparation' || orderStatus === 'Acceptée') {
                    newColor = '#ffeb42';
                }
            }
            
            if (newColor) {
                row.style.backgroundColor = newColor;
            }
        });
    }

    /**
     * Finds and marks duplicate order IDs with emojis.
     */
    function detectAndHighlightDuplicates() {
        // Clean previous emojis in one go
        document.querySelectorAll('.duplicate-emoji-red, .duplicate-emoji-green').forEach(emoji => emoji.remove());

        const tdElements = document.querySelectorAll('td.column-order_id span, td.column-code span');
        const valueMap = new Map();

        // Single pass to count and collect cells
        tdElements.forEach(span => {
            const value = span.textContent.trim();
            const td = span.closest('td');
            if (value) {
                if (!valueMap.has(value)) {
                    valueMap.set(value, []);
                }
                valueMap.get(value).push(td);
            }
        });

        // Single pass to apply emojis
        for (const tds of valueMap.values()) {
            if (tds.length > 1) {
                tds.forEach((td, index) => {
                    const isLast = index === tds.length - 1;
                    const emoji = isLast ? '✅' : '🔴';
                    const className = isLast ? 'duplicate-emoji-green' : 'duplicate-emoji-red';

                    const emojiSpan = document.createElement('span');
                    emojiSpan.textContent = emoji;
                    emojiSpan.classList.add(className);
                    
                    if (!td.querySelector(`.${className}`)) { 
                        td.appendChild(emojiSpan);
                    }
                });
            }
        }
    }


    /**
     * Efficiently scans the table ONCE to get all "Planifiée" data.
     */
    function getPlanifieData() {
        const tbody = document.querySelector('tbody.MuiTableBody-root.datagrid-body'); 
        const planifieOrders = [];

        if (tbody) {
            const rows = tbody.querySelectorAll('tr');
            rows.forEach(tr => {
                const type = tr.querySelector('td.column-type span')?.textContent.trim();
                const livreurStatus = tr.querySelector('td.column-livreur_status span')?.textContent.trim();
                
                if (type === 'Planifiée' && (livreurStatus === 'En recherche' || livreurStatus === 'Acceptée')) {
                    
                    const collectPoint = tr.querySelector('td.column-collect_point\\.name span')?.textContent.trim();
                    const orderId = tr.querySelector('td.column-order_id span')?.textContent.trim();
                    const orderDate = tr.querySelector('td.column-order_date span')?.textContent.trim();

                    if (collectPoint && orderId && orderDate) {
                        planifieOrders.push({ collectPoint, orderId, orderDate });
                    }
                }
            });
        }

        return planifieOrders;
    }

    /**
     * Creates or updates the custom form with the "Planifiée" order details.
     */
    function createOrUpdatePlanifieForm() {
        const targetForm = document.querySelector('form.jss55.jss56');
        if (!targetForm) return; 

        let newForm = document.getElementById('planifie-results-form');
        const planifieData = getPlanifieData();
        const count = planifieData.length;

        if (!newForm) {
            // Create form element
            newForm = document.createElement('form');
            newForm.id = 'planifie-results-form';
            Object.assign(newForm.style, { border: '2px dashed #007bff', padding: '20px', margin: '10px', borderRadius: '8px', backgroundColor: '#f9f9f9', fontFamily: 'Arial, sans-serif' });
            
            // Insert the new form after the target element
            const nextSibling = targetForm.nextElementSibling;
            if (nextSibling && nextSibling.tagName === 'SPAN') {
                targetForm.parentNode.insertBefore(newForm, nextSibling);
            } else {
                 targetForm.parentNode.insertBefore(newForm, targetForm.nextSibling);
            }
        } else {
             newForm.innerHTML = ''; // Clear for update
        }
        
        // Update count display
        const countDiv = document.createElement('div');
        countDiv.style.cssText = 'margin-bottom: 15px; font-size: 1.5em; font-weight: 600;';
        countDiv.innerHTML = `<span>Planifie: </span><span style="color: #007bff;">${count}</span>`;
        newForm.appendChild(countDiv);

        if (planifieData.length > 0) {
            // Create and populate results table
            const table = document.createElement('table');
            table.style.cssText = 'width: 100%; border-collapse: collapse;';
            
            const headerRow = table.insertRow();
            ['Collect Point', 'Order ID', 'Date Commande'].forEach(headerText => {
                const th = document.createElement('th');
                th.textContent = headerText;
                th.style.cssText = 'border: 1px solid #ddd; padding: 8px; background-color: #007bff; color: white; text-align: left;';
                headerRow.appendChild(th);
            });
            
            planifieData.forEach(rowData => {
                const row = table.insertRow();
                Object.values(rowData).forEach(text => {
                    const cell = row.insertCell();
                    cell.textContent = text;
                    cell.style.cssText = 'border: 1px solid #ddd; padding: 8px;';
                });
            });
            newForm.appendChild(table);
            
        } else {
            // Display no data message
            const noDataDiv = document.createElement('div');
            noDataDiv.textContent = 'Aucune commande planifiée à afficher.';
            noDataDiv.style.cssText = 'color: red; margin-top: 10px;';
            newForm.appendChild(noDataDiv);
        }
    }

    /**
     * Initializes the observer to watch for page changes.
     */
    function initializeObserver() {
        if (observer) return; 

        // Observer reacts to DOM mutations to apply styling and duplication highlights instantly
        observer = new MutationObserver(() => {
            applyAllRowStyles();
            detectAndHighlightDuplicates();
        });
        
        observer.observe(document.body, { childList: true, subtree: true });
    }

    /**
     * Main function: Checks for target element and starts/stops all recurring tasks.
     */
    function initializeOrRefreshView() {
        const targetForm = document.querySelector('form.jss55.jss56');
        
        if (!targetForm) {
            // Stop recurring tasks if target is not found (e.g., user navigated away)
            if (mainIntervalId) {
                clearInterval(mainIntervalId);
                mainIntervalId = null;
            }
            return;
        }

        if (!isInitialized) {
             initializeObserver(); // Start the persistent observer
             isInitialized = true;
        }
        
        // Immediate run to process the currently loaded table data
        createOrUpdatePlanifieForm();
        applyAllRowStyles();
        detectAndHighlightDuplicates();
        
        // Set up the interval for periodic data freshness (2 seconds)
        if (mainIntervalId) {
            clearInterval(mainIntervalId);
        }
        
        mainIntervalId = setInterval(createOrUpdatePlanifieForm, 2000);
    }


    // --- SCRIPT EXECUTION ---

    // Listen for hash changes (SPA navigation) and full page loads
    window.addEventListener('hashchange', initializeOrRefreshView);
    window.addEventListener('load', initializeOrRefreshView);
    
    // Initial check (100ms delay to ensure React app has started rendering)
    setTimeout(initializeOrRefreshView, 100); 

})();
