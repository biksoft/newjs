(() => {
    'use strict';

    let observer;
    let lastUpdateTimestamp = Date.now();

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
        if (!form || form.querySelector('.filter-field')) return;

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

    function initializeObserver() {
        if (observer) observer.disconnect();

        observer = new MutationObserver(() => {
            addPlanifieFieldToForm();
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }

    function applyScriptToPage() {
        const currentUrl = window.location.href;

        if (
            currentUrl.includes('/#/partnerOrders') ||
            currentUrl.includes('/#/orders')
        ) {
            addPlanifieFieldToForm();
            initializeObserver();
        } else if (observer) {
            observer.disconnect(); // Stop observing when on unrelated pages.
        }
    }

    function handleHashChange() {
        applyScriptToPage();
    }

    // Set up listeners for hash changes and initialize the script.
    window.addEventListener('hashchange', handleHashChange);

    // Run the script on initial load and set an interval to check the URL.
    setInterval(() => {
        applyScriptToPage();
    }, 1000);

    // Initial execution.
    applyScriptToPage();
})();
