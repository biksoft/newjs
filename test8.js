(() => {
    'use strict';

    let observer;
    let lastUpdateTimestamp = Date.now();

    // Function to count rows matching the specified conditions
    function countMatchingRows() {
        const tbody = document.querySelector('tbody.MuiTableBody-root.datagrid-body.jss80');
        if (!tbody) {
            console.error('The table body was not found.');
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

    // Function to get Planifie results
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

    // Function to style a form
    function styleForm(form) {
        form.style.border = '2px dashed #007bff';
        form.style.padding = '20px';
        form.style.margin = '10px';
        form.style.borderRadius = '8px';
        form.style.backgroundColor = '#f9f9f9';
        form.style.fontFamily = 'Arial, sans-serif';
        form.style.fontSize = '16px';
    }

    // Function to create Planifie Results Form
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
            styleForm(newForm);

            existingForm.parentNode.insertBefore(newForm, nextSibling);
        }

        // Update content
        newForm.innerHTML = '';

        // Add count display
        const fieldDiv = document.createElement('div');
        fieldDiv.style.marginTop = '15px';
        fieldDiv.style.fontSize = '1.5em';
        fieldDiv.style.fontWeight = '600';

        const label = document.createElement('span');
        label.textContent = 'Planifie: ';
        const countSpan = document.createElement('span');
        countSpan.style.color = '#007bff';
        countSpan.textContent = countMatchingRows();

        fieldDiv.appendChild(label);
        fieldDiv.appendChild(countSpan);
        newForm.appendChild(fieldDiv);

        // Add each result as a separate line
        const results = getPlanifieResults();
        results.forEach(result => {
            const resultDiv = document.createElement('div');
            resultDiv.textContent = result;
            resultDiv.style.fontSize = '1.2em';
            resultDiv.style.color = '#007bff';
            resultDiv.style.marginTop = '5px';
            resultDiv.style.display = 'block';
            newForm.appendChild(resultDiv);
        });

        // Refresh the count and results every 10 seconds
        setInterval(() => {
            countSpan.textContent = countMatchingRows();
            createPlanifieResultsForm(); // Re-render the form
        }, 10000);
    }

    // Observer and initializer functions
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

    function detectAndHighlightDuplicates() {
        const tdElements = document.querySelectorAll(
            'td.column-order_id span, td.column-code span'
        );

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
            const count = tds.length;

            if (count > 1) {
                cleanEmoji(tds[0]);
                addEmoji(tds[0], '🔴', 'duplicate-emoji-red');
                tds.slice(1).forEach(td => {
                    cleanEmoji(td);
                    addEmoji(td, '🔴', 'duplicate-emoji-red');
                });
            } else {
                tds.forEach(td => cleanEmoji(td));
            }
        });
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

    function highlightRows() {
        const rows = document.querySelectorAll('tr[resource="orders"], tr[resource="partnerOrders"]');
        rows.forEach(row => {
            const clientStatus = row.querySelector('td.column-client_status span')?.textContent.trim();
            const orderStatus = row.querySelector('td.column-status span')?.textContent.trim();
            if (clientStatus === 'Annulée' || orderStatus === 'Annulée') {
                row.style.backgroundColor = '#ff4242';
            } else if (clientStatus === 'Acceptée' || orderStatus === 'Acceptée') {
                row.style.backgroundColor = '#67eef4';
            }
        });
    }

    // On page load
    window.addEventListener('load', () => {
        initializeObserver();
        createPlanifieResultsForm();
    });
})();
