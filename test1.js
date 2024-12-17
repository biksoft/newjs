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
                (livreurStatusCell?.textContent.trim() === 'En recherche' && typeCell?.textContent.trim() === 'Planifiée') ||
                (livreurStatusCell?.textContent.trim() === 'Acceptée' && typeCell?.textContent.trim() === 'Planifiée')
            );
        });

        return matchingRows.length;
    }

    // Function to style the form
    function styleForm(form) {
        Object.assign(form.style, {
            border: '2px dashed #007bff',
            padding: '20px',
            margin: '10px',
            borderRadius: '8px',
            backgroundColor: '#f9f9f9',
            fontFamily: 'Arial, sans-serif',
            fontSize: '16px'
        });
    }

    // Function to add the new field to the form
    function addPlanifieFieldToForm() {
        const form = document.querySelector('form.jss55.jss56');
        if (!form) {
            console.error('The form was not found.');
            return;
        }

        // Apply modern styling to the form
        styleForm(form);

        const fieldDiv = document.createElement('div');
        fieldDiv.className = 'filter-field';
        fieldDiv.style.marginTop = '15px';
        fieldDiv.style.display = 'flex';
        fieldDiv.style.alignItems = 'center';

        const label = document.createElement('label');
        label.textContent = 'Planifie:';
        Object.assign(label.style, {
            marginRight: '12px',
            fontSize: '1.5em',
            fontWeight: '600',
            color: '#333'
        });

        const countSpan = document.createElement('span');
        countSpan.textContent = countMatchingRows();
        Object.assign(countSpan.style, {
            fontWeight: 'bold',
            fontSize: '1.5em',
            color: '#007bff'
        });

        fieldDiv.appendChild(label);
        fieldDiv.appendChild(countSpan);

        form.appendChild(fieldDiv);

        // Refresh the count every 10 seconds
        setInterval(() => {
            countSpan.textContent = countMatchingRows();
        }, 10000);
    }

    // Function to highlight rows based on specific conditions
    function highlightRows() {
        const rows = document.querySelectorAll('tr[resource="orders"], tr[resource="partnerOrders"]');
        rows.forEach(row => {
            const clientStatus = row.querySelector('td.column-client_status span')?.textContent.trim();
            const orderStatus = row.querySelector('td.column-status span')?.textContent.trim();

            // Simplified conditional checks
            if (clientStatus === 'Déposée' || orderStatus === 'Déposée') {
                row.style.backgroundColor = '#42ff79';
            } else if (clientStatus === 'En attente de paiement' || orderStatus === 'En recherche') {
                row.style.backgroundColor = '#ffeb42';
            } else if (clientStatus === 'Acceptée' || orderStatus === 'Acceptée') {
                row.style.backgroundColor = '#67eef4';
            } else if (clientStatus === 'Annulée' || orderStatus === 'Annulée') {
                row.style.backgroundColor = '#ff4242';
            } else if (clientStatus === 'Expirée' || orderStatus === 'Expirée') {
                row.style.backgroundColor = '#ff4242';
            }
        });
    }

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

            // Apply emojis for duplicates
            tds.forEach((td, index) => {
                cleanEmoji(td);
                const emoji = (index === 0) ? '🔴' : (index === tds.length - 1 ? '✅' : '🔴');
                const className = emoji === '🔴' ? 'duplicate-emoji-red' : 'duplicate-emoji-green';
                addEmoji(td, emoji, className);
            });
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

    function handleVisibilityChange() {
        if (document.visibilityState === 'visible') {
            detectAndHighlightDuplicates();
            highlightRows();
        }
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
        addPlanifieFieldToForm();
        document.addEventListener('visibilitychange', handleVisibilityChange);
    });
})();
