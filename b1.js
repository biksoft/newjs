(() => {
    'use strict';

    let observer;
    let lastUpdateTimestamp = Date.now();

    // Function to count rows matching the specified conditions
    function countMatchingRows() {
        const tbody = document.querySelector('tbody.MuiTableBody-root.datagrid-body.jss80');
        if (!tbody) return 0;

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

    // Function to retrieve "Planifie" results
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
                    results.push(
                        `${collectPointCell.textContent.trim()} [${orderIdCell.textContent.trim()}] : ${orderDateCell.textContent.trim()}`
                    );
                }
            }
        });
        return results;
    }

    // Function to display the results form
    function createPlanifieResultsForm() {
        const existingForm = document.querySelector('form.jss55.jss56');
        if (!existingForm) return;

        const nextSibling = existingForm.nextElementSibling;
        if (!nextSibling || nextSibling.tagName !== 'SPAN') return;

        let newForm = document.getElementById('planifie-results-form');
        if (!newForm) {
            newForm = document.createElement('form');
            newForm.id = 'planifie-results-form';
            newForm.className = 'MuiToolbar-root MuiToolbar-regular jss52 MuiToolbar-gutters';
            newForm.style.border = '2px dashed rgb(0, 123, 255)';
            newForm.style.padding = '20px';
            newForm.style.margin = '10px';
            newForm.style.borderRadius = '8px';
            newForm.style.backgroundColor = 'rgb(249, 249, 249)';
            newForm.style.fontFamily = 'Arial, sans-serif';
            newForm.style.fontSize = '16px';
            existingForm.parentNode.insertBefore(newForm, nextSibling);
        }

        // Update form content
        newForm.innerHTML = '';
        const count = countMatchingRows();
        const results = getPlanifieResults();

        const countDiv = document.createElement('div');
        countDiv.style.marginTop = '15px';
        countDiv.style.fontSize = '1.5em';
        countDiv.style.fontWeight = '600';
        countDiv.innerHTML = `<span>Planifie: </span><span style="color: rgb(0, 123, 255);">${count}</span>`;
        newForm.appendChild(countDiv);

        results.forEach(result => {
            const resultDiv = document.createElement('div');
            resultDiv.textContent = result;
            resultDiv.style.fontSize = '1.2em';
            resultDiv.style.color = 'rgb(0, 123, 255)';
            resultDiv.style.marginTop = '5px';
            resultDiv.style.display = 'block';
            newForm.appendChild(resultDiv);
        });
    }

    // Function to initialize observers
    function initializeObserver() {
        observer = new MutationObserver(() => {
            detectAndHighlightDuplicates();
            highlightRows();
            createPlanifieResultsForm();
            lastUpdateTimestamp = Date.now();
        });

        observer.observe(document.body, { childList: true, subtree: true });
        detectAndHighlightDuplicates();
        highlightRows();
        createPlanifieResultsForm();
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
            } else if (clientStatus === 'Annulée' || orderStatus === 'Annulée') {
                row.style.backgroundColor = '#ff4242';
            } else if (clientStatus === 'Expirée' || orderStatus === 'Expirée') {
                row.style.backgroundColor = '#ff4242';
            }
        });
    }

    // Function to detect duplicates and add emojis
    function detectAndHighlightDuplicates() {
        const tdElements = document.querySelectorAll('td.column-order_id span, td.column-code span');
        const values = Array.from(tdElements).map(span => ({
            value: span.textContent.trim(),
            td: span.closest('td')
        }));

        const valueCounts = {};
        values.forEach(({ value, td }) => {
            if (!valueCounts[value]) valueCounts[value] = { tds: [] };
            valueCounts[value].tds.push(td);
        });

        Object.keys(valueCounts).forEach(value => {
            const { tds } = valueCounts[value];
            if (tds.length > 1) {
                tds.forEach(td => td.style.backgroundColor = '#ffcccc');
                addEmoji(tds[0], '🔴', 'duplicate-emoji-red');
                addEmoji(tds[tds.length - 1], '✅', 'duplicate-emoji-green');
            }
        });
    }

    // Function to add emoji
    function addEmoji(td, emoji, className) {
        if (!td.querySelector(`.${className}`)) {
            const emojiSpan = document.createElement('span');
            emojiSpan.textContent = emoji;
            emojiSpan.classList.add(className);
            td.appendChild(emojiSpan);
        }
    }

    window.addEventListener('load', () => {
        initializeObserver();
        setInterval(createPlanifieResultsForm, 10000); // Refresh the results every 10 seconds
    });
})();
