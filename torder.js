'use strict';

// IDs for the elements
const CONTAINER_ID = 'livry-tools-container';
const RESULT_ELEMENT_ID = 'persistent-orders-count-result';

// Define colors for easy management
const COLOR_DEFAULT = '#4CAF50'; // Green
const COLOR_HOVER = '#66BB6A';
const COLOR_COPIED = '#00796B'; // Darker green confirmation
const COLOR_CANCEL = '#f44336'; // Red for cancel button
const COLOR_CANCEL_HOVER = '#e57373';

/**
 * Creates the entire UI toolkit ONCE and appends it directly to the document body.
 * This makes the UI independent of any other page elements.
 * @returns {HTMLElement} The main container element.
 */
function initializeUI() {
    // If the UI already exists, just return it.
    const existingContainer = document.getElementById(CONTAINER_ID);
    if (existingContainer) {
        return existingContainer;
    }

    // --- CONFIGURATION FOR ALL BUTTONS ---
    // Easily add, remove, or edit buttons here.
    const buttonsConfig = [
        {
            id: 'copy-new-client-button',
            text: 'New Client Msg',
            color: COLOR_DEFAULT,
            hoverColor: COLOR_HOVER,
            message: '{code} votre confirmation svp nouveau client {phone}'
        },
        {
            id: 'copy-existing-client-button',
            text: 'Existing Client Msg',
            color: COLOR_DEFAULT,
            hoverColor: COLOR_HOVER,
            message: '{code} votre confirmation svp'
        },
        {
            id: 'copy-cancel-button',
            text: 'Cancellation Msg',
            color: COLOR_CANCEL,
            hoverColor: COLOR_CANCEL_HOVER,
            message: 'votre commande {code} est annule'
        },
        {
            id: 'copy-contact-button',
            text: 'Contact Us Msg',
            color: '#2196F3', // Blue
            hoverColor: '#64B5F6',
            message: 'merci de nous contacter {phone}'
        }
    ];

    // --- CREATE THE UI ELEMENTS (this block only runs once) ---

    // 1. Create the main container.
    const container = document.createElement('div');
    container.id = CONTAINER_ID;
    container.style.cssText = `
        position: fixed !important;
        top: 20px !important;
        right: 20px !important;
        z-index: 9999 !important;
        background-color: #ffffff !important;
        padding: 15px !important;
        border-radius: 12px !important;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2) !important;
        display: flex !important;
        flex-direction: column !important; /* Stack elements vertically */
        align-items: flex-start !important;
        gap: 12px !important; /* Space between text and button group */
        visibility: hidden;
        opacity: 0;
        transition: visibility 0s, opacity 0.3s ease-in-out !important;
    `;

    // 2. Create the order count text element.
    const resultElement = document.createElement('p');
    resultElement.id = RESULT_ELEMENT_ID;
    resultElement.textContent = 'Loading...';
    resultElement.style.cssText = 'color: red !important; font-weight: bold !important; font-size: 1.1rem !important; margin: 0 0 5px 0 !important; white-space: nowrap; border-bottom: 1px solid #eee; padding-bottom: 10px; width: 100%;';
    container.appendChild(resultElement);

    // 3. Create a container for all the buttons.
    const buttonGroup = document.createElement('div');
    buttonGroup.style.cssText = 'display: flex !important; gap: 10px !important; flex-wrap: wrap !important;';

    // 4. Loop through the config to create each button.
    buttonsConfig.forEach(config => {
        const button = document.createElement('button');
        button.id = config.id;
        button.textContent = config.text;
        button.type = 'button';
        button.style.cssText = `
            background-color: ${config.color} !important;
            color: white !important;
            padding: 8px 15px !important;
            border: none !important;
            border-radius: 8px !important;
            cursor: pointer !important;
            font-family: inherit !important;
            font-weight: 500 !important;
            font-size: 0.9rem !important;
            transition: background-color 0.3s ease !important;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
            white-space: nowrap;
        `;

        // Add events for this specific button
        button.addEventListener('mouseenter', () => {
            if (!button.textContent.includes('Copied!')) {
                button.style.backgroundColor = config.hoverColor;
            }
        });
        button.addEventListener('mouseleave', () => {
            if (!button.textContent.includes('Copied!')) {
                button.style.backgroundColor = config.color;
            }
        });
        button.addEventListener('click', () => {
            const phoneInput = document.getElementById('phone');
            const codeInput = document.getElementById('code');
            const phoneValue = phoneInput ? phoneInput.value : '';
            const codeValue = codeInput ? codeInput.value : '';

            // Replace placeholders with actual values
            const finalMessage = config.message
                .replace('{phone}', phoneValue)
                .replace('{code}', codeValue);

            navigator.clipboard.writeText(finalMessage.trim()).then(() => {
                const originalText = button.textContent;
                button.style.backgroundColor = COLOR_COPIED;
                button.textContent = 'Copied! ✅';
                setTimeout(() => {
                    button.style.backgroundColor = config.color;
                    button.textContent = originalText;
                }, 2000);
            }).catch(err => console.error('Failed to copy message: ', err));
        });

        buttonGroup.appendChild(button);
    });

    container.appendChild(buttonGroup);

    // 5. Append the entire UI to the body.
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

        updateUI(displayText, true);

    } catch (error) {
        console.error("API Search Error:", error);
        updateUI('API Error', true);
    }
}

/**
 * Main check function that runs on a timer.
 */
function mainCheck() {
    const phoneInput = document.getElementById('phone');

    if (!phoneInput || !phoneInput.value) {
        updateUI('', false);
        return;
    }

    const currentPhoneNumber = phoneInput.value;
    const savedPhone = localStorage.getItem('savedPhoneNumber');
    const savedText = localStorage.getItem('savedDisplayText');

    if (currentPhoneNumber === savedPhone && savedText) {
        updateUI(savedText, true);
    } else {
        runApiSearch(currentPhoneNumber);
    }
}

// --- EXECUTION ---
// 1. Run the check immediately on script load for instant UI.
mainCheck();
// 2. Set it to run every second to watch for changes.
setInterval(mainCheck, 1000);

console.log("✅ Livry Tools (Multi-Button Toolkit) is running...");
