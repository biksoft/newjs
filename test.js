(() => {
    'use strict';

    let observer;
    let lastUpdateTimestamp = Date.now();

    const targetUrls = [
        'https://livry.flexi-apps.com/#/partnerOrders',
        'https://livry.flexi-apps.com/#/orders'
    ];

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

    function styleForm(form) {
        form.style.border = '2px dashed #007bff';
        form.style.padding = '20px';
        form.style.margin = '10px';
        form.style.borderRadius = '8px';
        form.style.backgroundColor = '#f9f9f9';
        form.style.fontFamily = 'Arial, sans-serif';
        form.style.fontSize = '16px';
    }

    function addPlanifieFieldToForm() {
        const form = document.querySelector('form.jss55.jss56');
        if (!form) return;

        styleForm(form);

        const fieldDiv = document.createElement('div');
        fieldDiv.className = 'filter-field';
        fieldDiv.style.marginTop = '15px';
        fieldDiv.style.display = 'flex';
        fieldDiv.style.alignItems = 'center';

        const label = document.createElement('label');
        label.textContent = 'Planifie:';
        label.style.marginRight = '12px';
        label.style.fontSize = '1.5em';
        label.style.fontWeight = '600';
        label.style.color = '#333';

        const countSpan = document.createElement('span');
        countSpan.textContent = countMatchingRows();
        countSpan.style.fontWeight = 'bold';
        countSpan.style.fontSize = '1.5em';
        countSpan.style.color = '#007bff';

        fieldDiv.appendChild(label);
        fieldDiv.appendChild(countSpan);

        form.appendChild(fieldDiv);

        setInterval(() => {
            countSpan.textContent = countMatchingRows();
        }, 10000);
    }

    function highlightRows() {
        const rows = document.querySelectorAll('tr[resource="orders"], tr[resource="partnerOrders"]');
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

    function detectUrlChange() {
        const currentUrl = window.location.href;
        if (targetUrls.includes(currentUrl)) {
            console.log('Detected target URL:', currentUrl);
            addPlanifieFieldToForm();
            highlightRows();
        }
    }

    function observeUrlChanges() {
        let lastUrl = window.location.href;

        setInterval(() => {
            const currentUrl = window.location.href;
            if (currentUrl !== lastUrl) {
                lastUrl = currentUrl;
                detectUrlChange();
            }
        }, 500);
    }

    window.addEventListener('load', () => {
        detectUrlChange();
        observeUrlChanges();
        addPlanifieFieldToForm();
        highlightRows();
    });
})();
