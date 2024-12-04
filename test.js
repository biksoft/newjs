(() => {
    'use strict';

    let observer;
    let lastUpdateTimestamp = Date.now();

    // Function to check the current URL and trigger your code if it matches
    function checkURLAndTriggerActions() {
        const currentURL = window.location.href;

        // Check if the current URL matches the specific links
        if (
            currentURL.includes('https://livry.flexi-apps.com/#/partnerOrders') ||
            currentURL.includes('https://livry.flexi-apps.com/#/orders')
        ) {
            console.log('Matching URL detected:', currentURL);
            
            // Call your functions here
            detectAndHighlightDuplicates();
            highlightRows();
            addPlanifieFieldToForm();
        }
    }

    // Function to initialize MutationObserver for detecting URL changes
    function monitorURLChanges() {
        const observer = new MutationObserver(() => {
            checkURLAndTriggerActions();
        });

        // Observe changes to the <body> element (React often re-renders this)
        observer.observe(document.body, { childList: true, subtree: true });
    }

    // Function to detect and highlight duplicates
    function detectAndHighlightDuplicates() {
        if (observer) observer.disconnect();

        const tdElements = document.querySelectorAll(
            'td.column-order_id span, td.column-code span'
        );

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

    // Function to add emoji
    function addEmoji(td, emoji, className) {
        if (!td.querySelector(`.${className}`)) {
            const emojiSpan = document.createElement('span');
            emojiSpan.textContent = emoji;
            emojiSpan.classList.add(className);
            td.appendChild(emojiSpan);
        }
    }

    // Function to clean emojis
    function cleanEmoji(td) {
        const existingEmojis = td.querySelectorAll('.duplicate-emoji-red, .duplicate-emoji-green');
        existingEmojis.forEach(emoji => emoji.remove());
    }

    // Function to highlight rows
    function highlightRows() {
        const rows = document.querySelectorAll(
            'tr[resource="orders"], tr[resource="partnerOrders"]'
        );

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

    // Function to add Planifie field
    function addPlanifieFieldToForm() {
        // Add your existing form-related logic here
    }

    // Run the URL monitoring and other setups on page load
    window.addEventListener('load', () => {
        monitorURLChanges();
        checkURLAndTriggerActions(); // Initial check
    });
})();
