(() => {
    'use strict';

    let observer;

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

    // Function to style the form
    function styleForm(form) {
        form.style.border = '2px dashed #007bff';
        form.style.padding = '20px';
        form.style.margin = '10px';
        form.style.borderRadius = '8px';
        form.style.backgroundColor = '#f9f9f9';
        form.style.fontFamily = 'Arial, sans-serif';
        form.style.fontSize = '16px';
    }

    // Function to add the new field to the form
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

    // Function to initialize the script on relevant pages
    function initializeScript() {
        addPlanifieFieldToForm();
        highlightRows();
        detectAndHighlightDuplicates();
    }

    // Observe DOM mutations to detect React route changes
    function setupObserver() {
        const targetNode = document.body;
        observer = new MutationObserver(() => {
            if (document.querySelector('form.jss55.jss56') && document.querySelector('tbody.MuiTableBody-root.datagrid-body.jss80')) {
                initializeScript();
            }
        });

        observer.observe(targetNode, { childList: true, subtree: true });
    }

    // Start the observer on page load
    window.addEventListener('load', () => {
        setupObserver();
    });
})();
