// ma.js

(function() {
    const targetNames = [
        "khalis kamal",
        "chafiqi adil",
        "belkrezia zouheira",
        "khallad abir",
        "azami ayoub",
        "ettabii tarik",
        "chaari hiba"
    ];

    // Normalize text content
    function normalizeText(text) {
        return text.trim().toLowerCase();
    }

    // Highlight matching rows
    function highlightRows() {
        const tdElements = document.querySelectorAll("td");
        tdElements.forEach(td => {
            if (targetNames.includes(normalizeText(td.textContent))) {
                const tr = td.closest("tr"); // Get the closest row for the cell
                if (tr) {
                    tr.style.backgroundColor = "yellow"; // Highlight the entire row
                    tr.style.fontWeight = "bold";
                }
            }
        });
    }

    // Execute the function immediately
    highlightRows();
})();
