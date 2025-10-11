'use strict';

// IDs for the elements
const CONTAINER_ID = 'livry-tools-container';
const RESULT_ELEMENT_ID = 'persistent-orders-count-result';
const COPY_BUTTON_ID = 'copy-confirmation-message-button';

// Define colors for easy management
const COLOR_DEFAULT = '#4CAF50'; // Green
const COLOR_HOVER = '#66BB6A';
const COLOR_COPIED = '#00796B'; // Darker green confirmation

/**
 * Creates the UI components the first time it's called and appends them to the DOM.
 * On subsequent calls, it simply returns the existing container element.
 * This function ensures the UI is only built ONCE.
 * @returns {HTMLElement | null} The main container element or null if the anchor isn't found.
 */
function initializeUI() {
    // If the UI already exists, do nothing and return it.
    const existingContainer = document.getElementById(CONTAINER_ID);
    if (existingContainer) {
        return existingContainer;
    }

    // Find the anchor element to insert our UI next to.
    const statutsHeader = Array.from(document.querySelectorAll('h6')).find(h => h.textContent.trim() === 'Statuts');
    if (!statutsHeader) {
        console.error("Could not find the 'Statuts' header to anchor the UI.");
        return null; // Can't build the UI if the anchor isn't there.
    }

    // --- CREATE THE UI ELEMENTS (only runs once) ---

    // 1. Create the main container
    const container = document.createElement('div');
    container.id = CONTAINER_ID;
    container.style.cssText = `
        display: flex !important; 
        align-items: center !important; 
        gap: 15px !important; 
        margin: 10px 0 !important;
        visibility: hidden; /* Start hidden by default */
        transition: visibility 0.1s;
    `;

    // 2. Create the order count text element
    const resultElement = document.createElement('p');
    resultElement.id = RESULT_ELEMENT_ID;
    resultElement.textContent = 'Loading...'; // Initial text
    resultElement.style.cssText = 'color: red !important; font-weight: bold !important; font-size: 1.1rem !important; margin: 0 !important;';
    container.appendChild(resultElement);

    // 3. Create the copy button
    const copyButton = document.createElement('button');
    copyButton.id = COPY_BUTTON_ID;
    copyButton.textContent = 'Copy Confirmation Message';
    copyButton.type = 'button';
    copyButton.style.cssText = `
        background-color: ${COLOR_DEFAULT} !important;
        color: white !important;
        padding: 10px 20px !important;
        border: none !important;
        border-radius: 8px !important;
        cursor: pointer !important;
        font-family: inherit !important;
        font-weight: 500 !important;
        transition: background-color 0.3s ease !important;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1) !important;
        -webkit-appearance: none !important;
        -moz-appearance: none !important;
        appearance: none !important;
    `;

    // Add hover effects
    copyButton.addEventListener('mouseenter', () => {
        if (!copyButton.textContent.includes('Copied!')) {
            copyButton.style.backgroundColor = COLOR_HOVER;
        }
    });
    copyButton.addEventListener('mouseleave', () => {
        copyButton.style.backgroundColor = copyButton.textContent.includes('Copied!') ? COLOR_COPIED : COLOR_DEFAULT;
    });

    // Add click logic
    copyButton.addEventListener('click', () => {
        const phoneInput = document.getElementById('phone');
        const codeInput = document.getElementById('code');

        if (phoneInput && codeInput) {
            const phoneNumber = phoneInput.value;
            const orderCode = codeInput.value;
            const finalMessage = `${orderCode} votre confirmation svp nouveau client ${phoneNumber}`;

            navigator.clipboard.writeText(finalMessage).then(() => {
                copyButton.style.backgroundColor = COLOR_COPIED;
                copyButton.textContent = 'Copied! ✅';
                setTimeout(() => {
                    copyButton.style.backgroundColor = COLOR_DEFAULT;
                    copyButton.textContent = 'Copy Confirmation Message';
                }, 2000);
            }).catch(err => console.error('Failed to copy message: ', err));
        } else {
            console.error("Could not find the required input fields with IDs 'phone' and 'code'.");
        }
    });
    container.appendChild(copyButton);

    // 4. Insert the complete UI into the page.
    statutsHeader.insertAdjacentElement('afterend', container);

    return container;
}


/**
 * Updates the text content and visibility of the UI.
 * @param {string} countText - The text to display in the result element.
 * @param {boolean} shouldBeVisible - Whether the UI should be visible or not.
 */
function updateUI(countText, shouldBeVisible) {
    const container = initializeUI(); // This will create the UI if it doesn't exist, or just get it if it does.
    if (!container) return;

    if (shouldBeVisible) {
        const resultElement = document.getElementById(RESULT_ELEMENT_ID);
        if (resultElement) {
            resultElement.textContent = countText;
        }
        container.style.visibility = 'visible'; // Make it visible
    } else {
        container.style.visibility = 'hidden'; // Hide it but keep its space
    }
}


/**
 * Performs an API search and updates the UI with the result.
 */
async function runApiSearch(phoneNumber) {
    console.log(`NEW PHONE NUMBER DETECTED: Running API search for ${phoneNumber}...`);
    try {
        const url = `https://livry.flexi-apps.com/api/v1/admin/users?%24filter=%7B%22q%22%3A%22${phoneNumber}%22%7D&%24skip=0&%24sort=%7B%22created_at%22%3A%22-1%22%7D&%24top=10&range=%5B0%2C9%5D`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`API Error: ${response.status}`);

        const data = await response.json();
        let displayText = 'Resto PLUS (+)'; // Default text for new clients

        if (data.value && data.value.length > 0) {
            const accounts = data.value;
            const accountCount = accounts.length;
            const totalOrders = accounts.reduce((sum, user) => sum + user.ordersCount, 0);

            displayText = accountCount > 1 ?
                `Total Orders: ${totalOrders} (from ${accountCount} accounts)` :
                `Orders Count: ${totalOrders}`;
        }

        localStorage.setItem('savedDisplayText', displayText);
        localStorage.setItem('savedPhoneNumber', phoneNumber);
        console.log(`Result saved for ${phoneNumber}: "${displayText}"`);

        updateUI(displayText, true); // Show and update the UI with the new text

    } catch (error) {
        console.error("API Search Error:", error);
        updateUI('API Error', true); // Show an error in the UI
    }
}

/**
 * The main function that checks for phone input and decides whether to update the UI.
 * This runs on a timer.
 */
function mainCheck() {
    const phoneInput = document.getElementById('phone');

    // If the phone input doesn't exist on the page, hide the UI.
    if (!phoneInput) {
        updateUI('', false); // Pass false to hide the UI.
        return;
    }

    const currentPhoneNumber = phoneInput.value;
    
    // If the phone input is empty, hide the UI but don't clear storage.
    if (!currentPhoneNumber) {
         updateUI('', false);
         return;
    }

    const savedPhone = localStorage.getItem('savedPhoneNumber');
    const savedText = localStorage.getItem('savedDisplayText');

    // If the phone number is the same one we've already checked, just show the saved result.
    if (currentPhoneNumber === savedPhone && savedText) {
        updateUI(savedText, true); // Pass true to show the UI.
    } else {
        // Otherwise, run a new API search for the new number.
        runApiSearch(currentPhoneNumber);
    }
}

// --- EXECUTION ---

// 1. Run the check immediately on script load to show the UI instantly.
mainCheck(); 

// 2. Then, set it to run on a 1-second interval to watch for changes.
setInterval(mainCheck, 1000);

console.log("✅ Livry Tools (Required Script) is running. Watching for changes...");
