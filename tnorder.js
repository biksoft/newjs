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
 * Creates the UI components ONCE and appends them directly to the document body.
 * This makes the UI independent of any other page elements.
 * @returns {HTMLElement} The main container element.
 */
function initializeUI() {
    // If the UI already exists, just return it.
    const existingContainer = document.getElementById(CONTAINER_ID);
    if (existingContainer) {
        return existingContainer;
    }

    // --- CREATE THE UI ELEMENTS (this block only runs once) ---

    // 1. Create the main container. It's now a fixed, floating element.
    const container = document.createElement('div');
    container.id = CONTAINER_ID;
    container.style.cssText = `
        position: fixed !important;
        top: 20px !important;
        right: 20px !important;
        z-index: 9999 !important; /* Ensures it stays on top of everything */
        background-color: #ffffff !important;
        padding: 15px !important;
        border-radius: 12px !important;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2) !important;
        display: flex !important; 
        align-items: center !important; 
        gap: 15px !important; 
        visibility: hidden; /* Start hidden */
        opacity: 0; /* Start transparent for fade effect */
        transition: visibility 0s, opacity 0.3s ease-in-out !important;
    `;

    // 2. Create the order count text element.
    const resultElement = document.createElement('p');
    resultElement.id = RESULT_ELEMENT_ID;
    resultElement.textContent = 'Loading...';
    resultElement.style.cssText = 'color: red !important; font-weight: bold !important; font-size: 1.1rem !important; margin: 0 !important; white-space: nowrap;';
    container.appendChild(resultElement);

    // 3. Create the copy button.
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
        white-space: nowrap;
    `;

    // Add button events
    copyButton.addEventListener('mouseenter', () => {
        if (!copyButton.textContent.includes('Copied!')) {
            copyButton.style.backgroundColor = COLOR_HOVER;
        }
    });
    copyButton.addEventListener('mouseleave', () => {
        copyButton.style.backgroundColor = copyButton.textContent.includes('Copied!') ? COLOR_COPIED : COLOR_DEFAULT;
    });
    copyButton.addEventListener('click', () => {
        const phoneInput = document.getElementById('phone');
        const codeInput = document.getElementById('code');
        if (phoneInput && codeInput) {
            const finalMessage = `${codeInput.value} votre confirmation svp nouveau client ${phoneInput.value}`;
            navigator.clipboard.writeText(finalMessage).then(() => {
                copyButton.style.backgroundColor = COLOR_COPIED;
                copyButton.textContent = 'Copied! ✅';
                setTimeout(() => {
                    copyButton.style.backgroundColor = COLOR_DEFAULT;
                    copyButton.textContent = 'Copy Confirmation Message';
                }, 2000);
            }).catch(err => console.error('Failed to copy message: ', err));
        } else {
            console.error("Could not find input fields 'phone' and 'code'.");
        }
    });
    container.appendChild(copyButton);

    // 4. Append the UI directly to the body.
    document.body.appendChild(container);

    return container;
}


/**
 * Updates the text and visibility of the UI with a fade effect.
 * @param {string} countText - The text to display.
 * @param {boolean} shouldBeVisible - If the UI should be visible.
 */
function updateUI(countText, shouldBeVisible) {
    const container = initializeUI(); // Ensures UI is created if it doesn't exist.
    if (!container) return;

    if (shouldBeVisible) {
        const resultElement = document.getElementById(RESULT_ELEMENT_ID);
        if (resultElement) {
            resultElement.textContent = countText;
        }
        container.style.visibility = 'visible';
        container.style.opacity = '1';
    } else {
        container.style.opacity = '0';
        container.style.visibility = 'hidden';
    }
}


/**
 * Performs an API search and updates the UI with the result.
 */
async function runApiSearch(phoneNumber) {
    console.log(`NEW PHONE NUMBER: Running API search for ${phoneNumber}...`);
    try {
        const url = `https://livry.flexi-apps.com/api/v1/admin/users?%24filter=%7B%22q%22%3A%22${phoneNumber}%22%7D&%24skip=0&%24sort=%7B%22created_at%22%3A%22-1%22%7D&%24top=10&range=%5B0%2C9%5D`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`API Error: ${response.status}`);

        const data = await response.json();
        let displayText = 'Resto PLUS (+)'; // Default for new clients

        if (data.value && data.value.length > 0) {
            const accounts = data.value;
            const totalOrders = accounts.reduce((sum, user) => sum + user.ordersCount, 0);
            displayText = accounts.length > 1 ?
                `Total Orders: ${totalOrders} (from ${accounts.length} accounts)` :
                `Orders Count: ${totalOrders}`;
        }

        localStorage.setItem('savedDisplayText', displayText);
        localStorage.setItem('savedPhoneNumber', phoneNumber);
        console.log(`Result saved for ${phoneNumber}: "${displayText}"`);

        updateUI(displayText, true); // Show and update the UI

    } catch (error) {
        console.error("API Search Error:", error);
        updateUI('API Error', true); // Show an error
    }
}

/**
 * Main check function that runs on a timer.
 */
function mainCheck() {
    const phoneInput = document.getElementById('phone');

    // If the phone input doesn't exist on the page, hide our UI.
    if (!phoneInput) {
        updateUI('', false);
        return;
    }

    const currentPhoneNumber = phoneInput.value;
    
    // If the phone input is empty, hide the UI.
    if (!currentPhoneNumber) {
         updateUI('', false);
         return;
    }

    const savedPhone = localStorage.getItem('savedPhoneNumber');
    const savedText = localStorage.getItem('savedDisplayText');

    // If number is the same as last time, just show the saved result.
    if (currentPhoneNumber === savedPhone && savedText) {
        updateUI(savedText, true);
    } else {
        // Otherwise, run a new API search.
        runApiSearch(currentPhoneNumber);
    }
}

// --- EXECUTION ---

// 1. Run the check immediately on script load for instant UI.
mainCheck(); 

// 2. Set it to run every second to watch for changes.
setInterval(mainCheck, 1000);

console.log("✅ Livry Tools (Independent UI) is running...");
