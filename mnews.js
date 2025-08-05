(() => {
    'use strict';

    /**
     * ===================================================================
     * HELPER FUNCTIONS
     * ===================================================================
     */

    // Function to count rows matching specific "Planifiée" conditions.
    function countPlanifieRows() {
        const rows = document.querySelectorAll('tbody.MuiTableBody-root tr');
        let count = 0;
        for (const tr of rows) {
            const livreurStatusCell = tr.querySelector('td.column-livreur_status span');
            const typeCell = tr.querySelector('td.column-type span');
            if (typeCell?.textContent.trim() === 'Planifiée') {
                const livreurStatus = livreurStatusCell?.textContent.trim();
                if (livreurStatus === 'En recherche' || livreurStatus === 'Acceptée') {
                    count++;
                }
            }
        }
        return count;
    }

    /**
     * ===================================================================
     * MAIN LOGIC - These functions run every 10 seconds.
     * ===================================================================
     */

    // This single function now handles ALL row coloring.
    // It uses direct '.style.backgroundColor' to prevent CSS conflicts.
    function highlightAllRows() {
        const rows = document.querySelectorAll(
            'tr[resource="orders"], tr[resource="partnerOrders"], tr[resource="supermarket-orders"]'
        );

        rows.forEach(row => {
            const clientStatus = row.querySelector('td.column-client_status span')?.textContent.trim();
            const orderStatus = row.querySelector('td.column-status span')?.textContent.trim();
            const typeStatus = row.querySelector('td.column-type span')?.textContent.trim();

            // IMPORTANT: Reset color first to handle status changes correctly.
            row.style.backgroundColor = '';

            // Apply new color based on status priority.
            // Using "if / else if" ensures only ONE color is applied per row.
            if (typeStatus === 'Planifiée') {
                row.style.backgroundColor = '#fc93d0';
            } else if (clientStatus === 'Annulée' || orderStatus === 'Annulée' || clientStatus === 'Expirée' || orderStatus === 'Expirée') {
                row.style.backgroundColor = '#ff4242';
            } else if (clientStatus === 'Déposée' || orderStatus === 'Déposée') {
                row.style.backgroundColor = '#42ff79';
            } else if (clientStatus === 'Livreur en route' || orderStatus === 'Récupérée' || clientStatus === 'Récupérée' || (clientStatus === 'Prête' && orderStatus === 'Acceptée')) {
                row.style.backgroundColor = '#5b9bd5';
            } else if (clientStatus === 'En attente de paiement' || clientStatus === 'En préparation' || orderStatus === 'En recherche') {
                row.style.backgroundColor = '#ffeb42';
            } else if (clientStatus === 'Acceptée' || orderStatus === 'Acceptée') {
                // This condition from your original script is complex.
                // It can mean different colors depending on context.
                // Let's default to a noticeable color.
                row.style.backgroundColor = '#e7e6e6';
            }
        });
    }


    // This function creates or updates the "Planifiée" counter form.
    function updatePlanifieCounter() {
        const targetForm = document.querySelector('form.jss55.jss56');
        if (!targetForm) return; // Exit if the target form isn't on the page yet

        // Remove the old counter form if it exists to prevent duplicates.
        const oldCounter = document.getElementById('custom-planifie-counter');
        if (oldCounter) {
            oldCounter.remove();
        }

        // Create the new form element to display the count.
        const newForm = document.createElement('form');
        newForm.id = 'custom-planifie-counter';
        // Apply some basic styling directly
        newForm.style.border = '2px dashed #007bff';
        newForm.style.padding = '20px';
        newForm.style.margin = '10px 0';
        newForm.style.borderRadius = '8px';
        newForm.style.backgroundColor = '#f9f9f9';

        const count = countPlanifieRows();
        newForm.innerHTML = `
            <div style="font-size: 1.5em; font-weight: 600; color: #333;">
                Planifié:
                <span style="font-weight: bold; color: #007bff;">${count}</span>
            </div>
        `;

        // Insert the new counter form right after the main filter form.
        targetForm.parentNode.insertBefore(newForm, targetForm.nextSibling);
    }


    /**
     * ===================================================================
     * SCRIPT INITIALIZATION
     * ===================================================================
     */

    // This is the main function that will be called every 10 seconds.
    function runAllUpdates() {
        highlightAllRows();
        updatePlanifieCounter();
        // NOTE: The duplicate detection part of your script was removed for simplicity,
        // as the main issues were row coloring and the counter. It can be added back here if needed.
    }

    // Wait for the window to fully load before starting.
    window.addEventListener('load', () => {
        console.log('Script starting. Checks will run every 10 seconds.');
        // Run it once immediately on load.
        runAllUpdates();
        // Then, set it to repeat every 10 seconds.
        setInterval(runAllUpdates, 10000);
    });

})();
