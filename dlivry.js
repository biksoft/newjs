(() => {
    'use strict';

    let observer;

    // A helper function to prevent the script from running too many times too quickly.
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
     * YOUR ORIGINAL CODE FOR THE "PLANIFIÉE" TABLE
     * ===================================================================
     */

    function countMatchingRows() {
        const tbody = document.querySelector('tbody.MuiTableBody-root.datagrid-body.jss80');
        if (!tbody) return 0;
        const rows = tbody.querySelectorAll('tr');
        return Array.from(rows).filter(tr => {
            const livreurStatusCell = tr.querySelector('td.column-livreur_status span');
            const typeCell = tr.querySelector('td.column-type span');
            return (
                (livreurStatusCell?.textContent.trim() === 'En recherche' && typeCell?.textContent.trim() === 'Planifiée') ||
                (livreurStatusCell?.textContent.trim() === 'Acceptée' && typeCell?.textContent.trim() === 'Planifiée')
            );
        }).length;
    }

    function getPlanifieResults() {
        const tbody = document.querySelector('tbody.MuiTableBody-root.datagrid-body.jss80');
        const results = [];
        if (!tbody) return results;
        const rows = tbody.querySelectorAll('tr');
        rows.forEach(tr => {
            const livreurStatusCell = tr.querySelector('td.column-livreur_status span');
            const typeCell = tr.querySelector('td.column-type span');
            if (
                (livreurStatusCell?.textContent.trim() === 'En recherche' && typeCell?.textContent.trim() === 'Planifiée') ||
                (livreurStatusCell?.textContent.trim() === 'Acceptée' && typeCell?.textContent.trim() === 'Planifiée')
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

    function createPlanifieResultsForm() {
        const existingForm = document.getElementById('planifie-results-form');
        if (existingForm) {
            existingForm.remove();
        }
        const targetForm = document.querySelector('form.jss55.jss56');
        if (!targetForm) return;
        const nextSibling = targetForm.nextElementSibling;
        if (!nextSibling || nextSibling.tagName !== 'SPAN') return;

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

        const count = countMatchingRows();
        const results = getPlanifieResults();
        const countDiv = document.createElement('div');
        countDiv.style.marginTop = '15px';
        countDiv.style.fontSize = '1.5em';
        countDiv.style.fontWeight = '600';
        countDiv.innerHTML = `<span>Planifie: </span><span style="color: rgb(0, 123, 255);">${count}</span>`;
        newForm.appendChild(countDiv);

        if (results.length > 0) {
            const table = document.createElement('table');
            table.style.width = '100%';
            table.style.borderCollapse = 'collapse';
            table.style.marginTop = '10px';
            const headerRow = document.createElement('tr');
            ['Collect Point', 'Order ID', 'Date Commande'].forEach(headerText => {
                const th = document.createElement('th');
                th.textContent = headerText;
                th.style.border = '1px solid #ddd';
                th.style.padding = '8px';
                th.style.backgroundColor = 'rgb(0, 123, 255)';
                th.style.color = '#fff';
                headerRow.appendChild(th);
            });
            table.appendChild(headerRow);
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
            noDataDiv.textContent = 'aucun commande planifie';
            noDataDiv.style.color = 'red';
            noDataDiv.style.marginTop = '10px';
            newForm.appendChild(noDataDiv);
        }
    }


    /**
     * ===================================================================
     * OTHER CORE FUNCTIONS
     * ===================================================================
     */

    // ## THIS FUNCTION IS NOW SMARTER TO PREVENT FLICKERING ##
    function highlightRows() {
        const rows = document.querySelectorAll('tr[resource="orders"], tr[resource="partnerOrders"], tr[resource="supermarket-orders"]');
        
        rows.forEach(row => {
            const clientStatus = row.querySelector('td.column-client_status span')?.textContent.trim();
            const orderStatus = row.querySelector('td.column-status span')?.textContent.trim();
            const typeStatus = row.querySelector('td.column-type span')?.textContent.trim();
            
            let newColor = ''; // Default: no color

            // Determine what the new color SHOULD be
            if (typeStatus === 'Planifiée') {
                newColor = '#fc93d0';
            } else if (clientStatus === 'Annulée' || orderStatus === 'Annulée' || clientStatus === 'Expirée' || orderStatus === 'Expirée') {
                newColor = '#ff4242';
            } else if (clientStatus === 'Déposée' || orderStatus === 'Déposée') {
                newColor = '#42ff79';
            } else if (clientStatus === 'Livreur en route' || orderStatus === 'Récupérée' || clientStatus === 'Récupérée' || (clientStatus === 'Prête' && orderStatus === 'Acceptée')) {
                newColor = '#5b9bd5';
            } else if (clientStatus === 'En attente de paiement' || clientStatus === 'En préparation' || orderStatus === 'En recherche') {
                newColor = '#ffeb42';
            } else if (clientStatus === 'Acceptée' || orderStatus === 'Acceptée') {
                newColor = '#e7e6e6';
            }

            // **THE FIX**: Only change the color if the new color is different from the current one.
            // We use a custom data attribute to track the color we've set.
            if (row.dataset.appliedColor !== newColor) {
                row.style.backgroundColor = newColor;
                row.dataset.appliedColor = newColor;
            }
        });
    }

    function detectAndHighlightDuplicates() {
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
    }

    function addEmoji(td, emoji, className) {
        if (!td || !td.querySelector) return;
        if (!td.querySelector(`.${className}`)) {
            const emojiSpan = document.createElement('span');
            emojiSpan.textContent = emoji;
            emojiSpan.classList.add(className);
            td.appendChild(emojiSpan);
        }
    }

    function cleanEmoji(td) {
        if (!td || !td.querySelectorAll) return;
        td.querySelectorAll('.duplicate-emoji-red, .duplicate-emoji-green').forEach(emoji => emoji.remove());
    }


    /**
     * ===================================================================
     * INITIALIZATION & THE SAFER UPDATE LOOP
     * ===================================================================
     */

    function runAllUpdates() {
        if (observer) {
            observer.disconnect();
        }

        highlightRows();
        detectAndHighlightDuplicates();
        createPlanifieResultsForm();

        if (observer) {
            observer.observe(document.body, { childList: true, subtree: true });
        }
    }

    function initialize() {
        const debouncedRunAllUpdates = debounce(runAllUpdates, 400);

        observer = new MutationObserver(debouncedRunAllUpdates);
        observer.observe(document.body, { childList: true, subtree: true });

        runAllUpdates();

        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                runAllUpdates();
            }
        });
    }

    window.addEventListener('load', initialize);

})();
