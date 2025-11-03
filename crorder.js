// url: https://raw.githubusercontent.com/biksoft/newjs/main/mrorder.js
// Optimized to consolidate "Set Online" functions and reduce redundant checks.

'use strict';

// --- IDs & Selectors ---
const CONTAINER_ID = 'livry-tools-container';
const RESULT_ELEMENT_ID = 'persistent-orders-count-result';
const SET_ONLINE_BUTTON_ID = 'set-livreur-online-button';
const RC_ONLINE_BUTTON_ID = 'set-rc-online-button'; // New ID for the specific RC button
const COPY_EMAIL_BUTTON_ID = 'copy-order-email-button';
const COPY_PHONE_BUTTON_ID = 'copy-order-phone-button';
const OPEN_MAPS_BUTTON_ID = 'open-order-maps-button';

const PRIMARY_RIDER_ID_SELECTOR = 'input[name="livreur"]';
const SECONDARY_RIDER_ID_SELECTOR = 'input[name="livreur._id"]';
const ORDER_ID_SOURCE_SELECTOR = 'a.form-tab[href^="#/orders/"]';

// --- Global State ---
let currentOrderId = null; // Track the current order page ID
let orderData = null; // Cache for the fetched order details
let lastPhoneNumber = null; // Cache for the last checked phone number

/**
 * Extracts the Order ID from the current URL hash.
 * @returns {string|null} The Order ID or null if not found.
 */
function extractOrderId() {
    const linkElement = document.querySelector(ORDER_ID_SOURCE_SELECTOR);
    if (!linkElement) return null;
    const urlParts = linkElement.href.split('/orders/');
    if (urlParts.length < 2) return null;
    const orderId = urlParts[1].split('/')[0];
    return (orderId && orderId.length === 24) ? orderId : null;
}

/**
 * Extracts the Livreur (Rider) ID from the page.
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
 * Fetches data for a specific order and caches it.
 * @param {string} orderId - The ID of the order to fetch.
 */
async function fetchOrderData(orderId) {
    console.log(`Fetching data for Order ID: ${orderId}...`);
    try {
        const url = `https://livry.flexi-apps.com/api/v1/admin/orders/${orderId}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const data = await response.json();

        const restaurantInfo = data.restaurantInfo || {};
        const coordinates = data.clientLocation?.coordinates || restaurantInfo.location?.coordinates;

        if (!coordinates) {
             throw new Error("Coordinates not found in order data.");
        }

        // Cache the formatted data globally
        orderData = {
            email: restaurantInfo.email || "N/A",
            phone: restaurantInfo.phoneNumber || restaurantInfo.phone || "N/A",
            // The URL format has been corrected/standardized here:
            mapsLink: `https://maps.google.com/?q=${coordinates[1]},${coordinates[0]}`
        };
        console.log(`✅ Data fetched for order ${orderId}.`);
        updateOrderButtonsVisibility(); // Update buttons with new data

    } catch (error) {
        console.error("❌ Error fetching order data:", error);
        orderData = null; // Clear cache on error
        updateOrderButtonsVisibility();
    }
}


/**
 * Creates the entire UI toolkit ONCE and appends it to the document body.
 * NOTE: The RC Online button is added here, replacing the logic in addRCOnlineButton.js
 */
function initializeUI() {
    if (document.getElementById(CONTAINER_ID)) return;

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

    const resultElement = document.createElement('p');
    resultElement.id = RESULT_ELEMENT_ID;
    resultElement.style.cssText = 'color: red !important; font-weight: bold !important; font-size: 1.1rem !important; margin: 0 0 5px 0 !important; white-space: nowrap; border-bottom: 1px solid #eee; padding-bottom: 10px; width: 100%;';
    container.appendChild(resultElement);

    const buttonGroup = document.createElement('div');
    buttonGroup.style.cssText = 'display: flex !important; gap: 10px !important; flex-wrap: wrap !important;';

    // --- Button Definitions ---
    const buttons = [
        // Order-Context Buttons
        { id: OPEN_MAPS_BUTTON_ID, text: '🗺️ Maps', color: '#4299e1', hidden: true, onClick: () => window.open(orderData.mapsLink, '_blank') },
        { id: COPY_EMAIL_BUTTON_ID, text: '📧 Copy Email', color: '#38a169', hidden: true, onClick: (btn) => copyToClipboard(btn, orderData.email) },
        { id: COPY_PHONE_BUTTON_ID, text: '📞 Copy Phone', color: '#f6ad55', hidden: true, onClick: (btn) => copyToClipboard(btn, orderData.phone) },
        // Rider Status Buttons
        { id: SET_ONLINE_BUTTON_ID, text: '🟢 Set Online (Current)', color: '#4CAF50', hidden: true, onClick: (btn) => handleSetOnline(btn, extractLivreurId()) },
        { id: RC_ONLINE_BUTTON_ID, text: '🟢 Set RC Online', color: '#007bff', hidden: false, onClick: (btn) => handleSetOnline(btn, '5fef37220b63c0111edee4b0') },
        // Other Tools
        { id: 'copy-new-client-button', text: 'New Client Msg', color: '#4CAF50', hidden: false, onClick: (btn) => {
            const phone = document.getElementById('phone')?.value || '';
            const code = document.getElementById('code')?.value || '';
            copyToClipboard(btn, `${code} votre confirmation svp nouveau client ${phone}`);
        }},
    ];

    buttons.forEach(config => {
        const button = document.createElement('button');
        button.id = config.id;
        button.textContent = config.text;
        button.type = 'button';
        button.style.cssText = `
            background-color: ${config.color} !important; color: white !important;
            padding: 8px 15px !important; border: none !important; border-radius: 8px !important;
            cursor: pointer !important; font-weight: 500 !important; font-size: 0.9rem !important;
            transition: background-color 0.3s ease !important;
            display: ${config.hidden ? 'none' : 'inline-block'};
        `;
        button.addEventListener('click', () => config.onClick(button));
        buttonGroup.appendChild(button);
    });

    container.appendChild(buttonGroup);
    document.body.appendChild(container);
    
    // Add the RC Online button to the header next to the profil button (old addRCOnlineButton.js logic)
    waitForElement('div.jss21', addRCOnlineButtonToHeader);
}

// --- Clipboard & Generic API Functions ---

async function copyToClipboard(button, text) {
    // ... (copyToClipboard remains the same)
    if (!text || text === "N/A") {
        button.textContent = '❌ N/A';
        setTimeout(() => button.textContent = button.id.includes('Email') ? '📧 Copy Email' : '📞 Copy Phone', 2000);
        return;
    }
    const originalText = button.textContent;
    try {
        await navigator.clipboard.writeText(text);
        button.textContent = '✅ Copied!';
    } catch (err) {
        console.error('Failed to copy:', err);
        button.textContent = '❌ Failed!';
    }
    setTimeout(() => button.textContent = originalText, 2000);
}

/**
 * Executes the API call to set a specific rider's status to "online".
 * @param {HTMLElement} button The button that was clicked.
 * @param {string} livreurId - The ID of the rider to set online.
 */
async function handleSetOnline(button, livreurId) {
    if (!livreurId) return alert('Cannot find Rider ID.');

    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = 'Processing...';
    try {
        const response = await fetch(`https://livry.flexi-apps.com/api/v1/admin/livreurs/${livreurId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: "online" })
        });
        if (!response.ok) throw new Error(`API Error ${response.status}`);
        button.textContent = '✅ Online Set';
        alert(`Rider ${livreurId} is now ONLINE.`);
    } catch (error) {
        button.textContent = '❌ Failed';
        alert(`Failed to set status: ${error.message}`);
    } finally {
        button.disabled = false;
        setTimeout(() => button.textContent = originalText, 3000);
    }
}


/**
 * Shows or hides the order-specific buttons and updates their text.
 */
function updateOrderButtonsVisibility() {
    const emailBtn = document.getElementById(COPY_EMAIL_BUTTON_ID);
    const phoneBtn = document.getElementById(COPY_PHONE_BUTTON_ID);
    const mapsBtn = document.getElementById(OPEN_MAPS_BUTTON_ID);
    if (!emailBtn || !phoneBtn || !mapsBtn) return;

    const shouldBeVisible = !!orderData;

    emailBtn.style.display = shouldBeVisible ? 'inline-block' : 'none';
    phoneBtn.style.display = shouldBeVisible ? 'inline-block' : 'none';
    mapsBtn.style.display = shouldBeVisible ? 'inline-block' : 'none';
}

/**
 * Adds the 'RC online' button to the header next to the Profile button.
 * This replaces the logic in addRCOnlineButton.js.
 */
function addRCOnlineButtonToHeader(container) {
    const button = document.createElement('button');
    button.innerText = 'RC online';
    button.style.cssText = `
        background-color: #007bff; color: white; font-size: 14px; padding: 8px 15px;
        border: none; border-radius: 4px; cursor: pointer; margin-right: 10px;
        transition: background-color 0.3s ease, transform 0.2s ease;
    `;

    button.onmouseover = () => { button.style.backgroundColor = '#0056b3'; button.style.transform = 'scale(1.05)'; };
    button.onmouseleave = () => { button.style.backgroundColor = '#007bff'; button.style.transform = 'scale(1)'; };
    button.onmousedown = () => { button.style.backgroundColor = '#004085'; };
    button.onmouseup = () => { button.style.backgroundColor = '#0056b3'; };

    button.addEventListener('click', function () {
        handleSetOnline(this, '5fef37220b63c0111edee4b0');
    });

    const profilButton = container.querySelector('button[aria-label="Profil"]');
    if (profilButton) {
        container.insertBefore(button, profilButton);
    } else {
        console.warn('Could not locate the Profil button for RC Online.');
    }
}

// Simple utility to wait for an element (taken from the original addRCOnlineButton.js)
function waitForElement(selector, callback) {
    const element = document.querySelector(selector);
    if (element) {
        callback(element);
    } else {
        setTimeout(() => waitForElement(selector, callback), 500);
    }
}


/**
 * Handles the persistent orders count feature.
 * Optimized to use a cache for the phone number check.
 */
function handleCustomerOrderHistory(currentPhoneNumber) {
    const phoneInput = document.getElementById('phone');
    const container = document.getElementById(CONTAINER_ID);
    const resultText = document.getElementById(RESULT_ELEMENT_ID);

    if (!phoneInput || !currentPhoneNumber) {
        if(resultText) resultText.style.display = 'none';
        if(container) {
             container.style.visibility = 'hidden';
             container.style.opacity = '0';
        }
        return;
    }

    if(resultText) resultText.style.display = 'block';
    if(container) {
        container.style.visibility = 'visible';
        container.style.opacity = '1';
    }

    // Check if the phone number has changed since the last check
    if (currentPhoneNumber === lastPhoneNumber) {
        const savedText = localStorage.getItem('savedDisplayText');
        if (savedText) {
            if(resultText) resultText.textContent = savedText;
        }
        return;
    }
    
    lastPhoneNumber = currentPhoneNumber; // Update the cache

    const url = `https://livry.flexi-apps.com/api/v1/admin/users?%24filter=%7B%22q%22%3A%22${currentPhoneNumber}%22%7D`;
    fetch(url)
        .then(res => res.json())
        .then(data => {
            let displayText = 'Resto PLUS (+)';
            if (data.value && data.value.length > 0) {
                const total = data.value.reduce((sum, user) => sum + user.ordersCount, 0);
                displayText = `Orders: ${total}`;
            }
            localStorage.setItem('savedDisplayText', displayText);
            localStorage.setItem('savedPhoneNumber', currentPhoneNumber);
            if(resultText) resultText.textContent = displayText;
        }).catch(error => console.error("Error fetching order count:", error));
}


/**
 * Main check function that runs every second.
 * This is the public interface for the main userscript.
 */
function mainCheck() {
    initializeUI(); // Ensure UI exists.

    // 1. Order-Context Buttons (Maps, Email, Phone)
    const newOrderId = extractOrderId();
    if (newOrderId && newOrderId !== currentOrderId) {
        currentOrderId = newOrderId;
        orderData = null;
        updateOrderButtonsVisibility();
        fetchOrderData(newOrderId);
    } else if (!newOrderId && currentOrderId) {
        currentOrderId = null;
        orderData = null;
        updateOrderButtonsVisibility();
    } else if (newOrderId && orderData) {
        updateOrderButtonsVisibility(); // Re-ensure visibility if data is loaded
    }

    // 2. Rider "Set Online" Button
    const setOnlineBtn = document.getElementById(SET_ONLINE_BUTTON_ID);
    if (setOnlineBtn) {
        const currentRiderId = extractLivreurId();
        setOnlineBtn.style.display = currentRiderId ? 'inline-block' : 'none';
        setOnlineBtn.textContent = currentRiderId ? '🟢 Set Online (Current)' : 'N/A';
    }

    // 3. Customer Order History Panel
    const phoneInput = document.getElementById('phone');
    const currentPhoneNumber = phoneInput?.value || null;
    handleCustomerOrderHistory(currentPhoneNumber);
}

// Expose the core function globally for the main script to call
window.mrorder = {
    mainCheck
};

console.log("✅ mrorder.js functions initialized.");
