'use strict';

// --- IDs & Selectors ---
const CONTAINER_ID = 'livry-tools-container';
const RESULT_ELEMENT_ID = 'persistent-orders-count-result';
const SET_ONLINE_BUTTON_ID = 'set-livreur-online-button';
const PRIMARY_RIDER_ID_SELECTOR = 'input[name="livreur"]';
const SECONDARY_RIDER_ID_SELECTOR = 'input[name="livreur._id"]';

// --- Colors ---
const COLOR_DEFAULT = '#4CAF50';
const COLOR_HOVER = '#66BB6A';
const COLOR_COPIED = '#00796B';
const COLOR_ONLINE_SUCCESS = 'rgb(76, 175, 80)';
const COLOR_ONLINE_FAIL = 'rgb(244, 67, 54)';
const COLOR_ONLINE_PROCESSING = 'rgb(255, 152, 0)';

/**
 * Extracts the Livreur ID from the page using two different selectors.
 * @returns {string|null} The Livreur ID or null if not found.
 */
function extractLivreurId() {
    const primaryInput = document.querySelector(PRIMARY_RIDER_ID_SELECTOR);
    if (primaryInput && primaryInput.value && primaryInput.value.length === 24) {
        return primaryInput.value;
    }
    const secondaryInput = document.querySelector(SECONDARY_RIDER_ID_SELECTOR);
    if (secondaryInput && secondaryInput.value && secondaryInput.value.length === 24) {
        return secondaryInput.value;
    }
    return null;
}

/**
 * Executes the PUT request to set the current rider's status to "online".
 * @param {HTMLElement} button - The button element to update its state.
 */
async function handleSetOnline(button) {
    const livreurId = extractLivreurId(); // Get the ID at the moment of the click
    if (!livreurId) {
        alert('Cannot find Rider ID to set online status.');
        return;
    }

    const apiUrl = `https://livry.flexi-apps.com/api/v1/admin/livreurs/${livreurId}`;
    const originalText = button.textContent;
    const originalColor = button.style.backgroundColor;

    button.disabled = true;
    button.textContent = 'Processing...';
    button.style.backgroundColor = COLOR_ONLINE_PROCESSING;

    try {
        const response = await fetch(apiUrl, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: "online" })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(`API Error: ${err.message || response.status}`);
        }

        console.log(`✅ Livreur ${livreurId} status updated to ONLINE.`);
        button.textContent = '✅ Online Set';
        button.style.backgroundColor = COLOR_ONLINE_SUCCESS;
        alert(`Rider ${livreurId} status set to ONLINE successfully.`);

    } catch (error) {
        console.error('❌ Failed to update status:', error);
        button.textContent = '❌ Failed';
        button.style.backgroundColor = COLOR_ONLINE_FAIL;
        alert(`Failed to update status for ${livreurId}: ${error.message}.`);
    } finally {
        button.disabled = false;
        setTimeout(() => {
            button.textContent = originalText;
            button.style.backgroundColor = originalColor;
        }, 3000);
    }
}


/**
 * Creates the entire UI toolkit ONCE and appends it directly to the document body.
 * @returns {HTMLElement} The main container element.
 */
function initializeUI() {
    if (document.getElementById(CONTAINER_ID)) {
        return document.getElementById(CONTAINER_ID);
    }

    // --- Button Configuration for Copyable Messages ---
    const copyButtonsConfig = [
        {
            id: 'copy-new-client-button',
            text: 'New Client Msg',
            color: COLOR_DEFAULT,
            hoverColor: COLOR_HOVER,
            message: '{code} votre confirmation svp nouveau client {phone}'
        }
        // Other buttons removed as requested
    ];

    // 1. Create the main container.
    const container = document.createElement('div');
    container.id = CONTAINER_ID;
    container.style.cssText = `
        position: fixed !important; top: 20px !important; right: 20px !important;
        z-index: 9999 !important; background-color: #ffffff !important;
        padding: 15px !important; border-radius: 12px !important;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2) !important; display: flex !important;
        flex-direction: column !important; align-items: flex-start !important;
        gap: 12px !important; visibility: hidden; opacity: 0;
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

    // 4. Create the "Set Online" button (handled specially).
    const setOnlineBtn = document.createElement('button');
    setOnlineBtn.id = SET_ONLINE_BUTTON_ID;
    setOnlineBtn.textContent = '🟢 Set Online';
    setOnlineBtn.type = 'button';
    setOnlineBtn.style.cssText = `
        background-color: ${COLOR_ONLINE_SUCCESS} !important; color: white !important;
        padding: 8px 15px !important; border: none !important; border-radius: 8px !important;
        cursor: pointer !important; font-weight: 500 !important; font-size: 0.9rem !important;
        transition: background-color 0.3s ease !important; display: none; /* Hidden by default */
    `;
    setOnlineBtn.addEventListener('click', () => handleSetOnline(setOnlineBtn));
    buttonGroup.appendChild(setOnlineBtn);

    // 5. Loop through the config to create "Copy" buttons.
    copyButtonsConfig.forEach(config => {
        const button = document.createElement('button');
        button.id = config.id;
        button.textContent = config.text;
        button.type = 'button';
        button.style.backgroundColor = config.color;
        button.style.cssText += `
            color: white !important; padding: 8px 15px !important; border: none !important;
            border-radius: 8px !important; cursor: pointer !important; font-weight: 500 !important;
            font-size: 0.9rem !important; transition: background-color 0.3s ease !important;
        `;

        button.addEventListener('mouseenter', () => {
            if (!button.textContent.includes('Copied!')) button.style.backgroundColor = config.hoverColor;
        });
        button.addEventListener('mouseleave', () => {
            if (!button.textContent.includes('Copied!')) button.style.backgroundColor = config.color;
        });
        button.addEventListener('click', () => {
            const phoneValue = document.getElementById('phone')?.value || '';
            const codeValue = document.getElementById('code')?.value || '';
            const finalMessage = config.message.replace('{phone}', phoneValue).replace('{code}', codeValue);

            navigator.clipboard.writeText(finalMessage.trim()).then(() => {
                const originalText = button.textContent;
                button.style.backgroundColor = COLOR_COPIED;
                button.textContent = 'Copied! ✅';
                setTimeout(() => {
                    button.style.backgroundColor = config.color;
                    button.textContent = originalText;
                }, 2000);
            });
        });
        buttonGroup.appendChild(button);
    });

    container.appendChild(buttonGroup);
    document.body.appendChild(container);
    return container;
}


/**
 * Updates the visibility of the main UI panel.
 * @param {string} countText - The text to display.
 * @param {boolean} shouldBeVisible - If the UI should be visible.
 */
function updateUIVisibility(countText, shouldBeVisible) {
    const container = initializeUI();
    if (shouldBeVisible) {
        const resultElement = document.getElementById(RESULT_ELEMENT_ID);
        if (resultElement) resultElement.textContent = countText;
        container.style.visibility = 'visible';
        container.style.opacity = '1';
    } else {
        container.style.opacity = '0';
        container.style.visibility = 'hidden';
    }
}

/**
 * Updates the visibility of the "Set Online" button based on whether a Livreur ID is found.
 */
function updateSetOnlineButtonVisibility() {
    const setOnlineBtn = document.getElementById(SET_ONLINE_BUTTON_ID);
    if (!setOnlineBtn) return; // Exit if UI not ready

    const livreurId = extractLivreurId();
    setOnlineBtn.style.display = livreurId ? 'inline-block' : 'none';
}


/**
 * Performs an API search for customer order history.
 */
async function runApiSearch(phoneNumber) {
    console.log(`Running API search for ${phoneNumber}...`);
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
        updateUIVisibility(displayText, true);

    } catch (error) {
        console.error("API Search Error:", error);
        updateUIVisibility('API Error', true);
    }
}

/**
 * Main check function that runs every second.
 */
function mainCheck() {
    // This function now controls EVERYTHING.
    initializeUI(); // Ensure UI is always ready.

    // 1. Control "Set Online" button visibility
    updateSetOnlineButtonVisibility();

    // 2. Control Order Count / Main Panel visibility
    const phoneInput = document.getElementById('phone');
    if (!phoneInput || !phoneInput.value) {
        updateUIVisibility('', false);
        return;
    }

    const currentPhoneNumber = phoneInput.value;
    const savedPhone = localStorage.getItem('savedPhoneNumber');
    const savedText = localStorage.getItem('savedDisplayText');

    if (currentPhoneNumber === savedPhone && savedText) {
        updateUIVisibility(savedText, true);
    } else {
        runApiSearch(currentPhoneNumber);
    }
}

// --- EXECUTION ---
mainCheck(); // Run once immediately.
setInterval(mainCheck, 1000); // Run every second to check for all changes.

console.log("✅ Livry Tools (Combined Toolkit) is running...");
