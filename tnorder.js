'use strict';

// --- IDs & Selectors ---
const CONTAINER_ID = 'livry-tools-container';
const RESULT_ELEMENT_ID = 'persistent-orders-count-result';
const SET_ONLINE_BUTTON_ID = 'set-livreur-online-button';
const COPY_EMAIL_BUTTON_ID = 'copy-order-email-button';
const COPY_PHONE_BUTTON_ID = 'copy-order-phone-button';
const OPEN_MAPS_BUTTON_ID = 'open-order-maps-button';

const PRIMARY_RIDER_ID_SELECTOR = 'input[name="livreur"]';
const SECONDARY_RIDER_ID_SELECTOR = 'input[name="livreur._id"]';
const ORDER_ID_SOURCE_SELECTOR = 'a.form-tab[href^="#/orders/"]';

// --- Global State ---
let currentOrderId = null; // Track the current order page ID
let orderData = null; // Cache for the fetched order details

/**
 * Extracts the Order ID from the current URL hash.
 * @returns {string|null}
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
 * @returns {string|null}
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
 * @param {string} orderId
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
        if (!coordinates) throw new Error("Coordinates not found in order data.");

        orderData = {
            email: restaurantInfo.email || "N/A",
            phone: restaurantInfo.phoneNumber || restaurantInfo.phone || "N/A",
            mapsLink: `https://www.google.com/maps/search/?api=1&query=$${coordinates[1]},${coordinates[0]}`
        };
        console.log(`✅ Data fetched for order ${orderId}.`);
        updateContextualButtonsVisibility(); // Update buttons now that data is ready

    } catch (error) {
        console.error("❌ Error fetching order data:", error);
        orderData = null;
        updateContextualButtonsVisibility();
    }
}

/**
 * Creates the entire UI toolkit ONCE.
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
    resultElement.style.cssText = 'color: red !important; font-weight: bold !important; font-size: 1.1rem !important; margin: 0 0 5px 0 !important; white-space: nowrap; border-bottom: 1px solid #eee; padding-bottom: 10px; width: 100%; display: none;';
    container.appendChild(resultElement);

    const buttonGroup = document.createElement('div');
    buttonGroup.style.cssText = 'display: flex !important; gap: 10px !important; flex-wrap: wrap !important;';

    const buttons = [
        { id: OPEN_MAPS_BUTTON_ID, text: '🗺️ Maps', color: '#4299e1', hidden: true, onClick: () => window.open(orderData.mapsLink, '_blank') },
        { id: COPY_EMAIL_BUTTON_ID, text: '📧 Copy Email', color: '#38a169', hidden: true, onClick: (btn) => copyToClipboard(btn, orderData.email, '📧 Copy Email') },
        { id: COPY_PHONE_BUTTON_ID, text: '📞 Copy Phone', color: '#f6ad55', hidden: true, onClick: (btn) => copyToClipboard(btn, orderData.phone, '📞 Copy Phone') },
        { id: SET_ONLINE_BUTTON_ID, text: '🟢 Set Online', color: '#4CAF50', hidden: true, onClick: handleSetOnline },
        { id: 'copy-new-client-button', text: 'New Client Msg', color: '#4CAF50', hidden: false, onClick: (btn) => {
            const phone = document.getElementById('phone')?.value || '';
            const code = document.getElementById('code')?.value || '';
            copyToClipboard(btn, `${code} votre confirmation svp nouveau client ${phone}`, 'New Client Msg');
        }},
    ];

    buttons.forEach(config => {
        const button = document.createElement('button');
        button.id = config.id;
        button.textContent = config.text;
        button.type = 'button';
        button.style.cssText = `background-color: ${config.color} !important; color: white !important; padding: 8px 15px !important; border: none !important; border-radius: 8px !important; cursor: pointer !important; font-weight: 500 !important; font-size: 0.9rem !important; transition: background-color 0.3s ease !important; display: ${config.hidden ? 'none' : 'inline-block'};`;
        button.addEventListener('click', () => config.onClick(button));
        buttonGroup.appendChild(button);
    });

    container.appendChild(buttonGroup);
    document.body.appendChild(container);
}

async function copyToClipboard(button, text, originalText) {
    if (!text || text === "N/A") {
        button.textContent = '❌ N/A';
        setTimeout(() => button.textContent = originalText, 2000);
        return;
    }
    try {
        await navigator.clipboard.writeText(text);
        button.textContent = '✅ Copied!';
    } catch (err) {
        button.textContent = '❌ Failed!';
    }
    setTimeout(() => button.textContent = originalText, 2000);
}

async function handleSetOnline(button) {
    const livreurId = extractLivreurId();
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
    } finally {
        button.disabled = false;
        setTimeout(() => button.textContent = originalText, 3000);
    }
}

/**
 * This function is now the single source of truth for all context-aware buttons.
 * It is called by the MutationObserver whenever the page content changes.
 */
function updateContextualButtonsVisibility() {
    // --- Handle Rider "Set Online" Button ---
    const setOnlineBtn = document.getElementById(SET_ONLINE_BUTTON_ID);
    if (setOnlineBtn) {
        setOnlineBtn.style.display = extractLivreurId() ? 'inline-block' : 'none';
    }

    // --- Handle Order-Context Buttons (Maps, Email, Phone) ---
    const newOrderId = extractOrderId();
    const emailBtn = document.getElementById(COPY_EMAIL_BUTTON_ID);
    const phoneBtn = document.getElementById(COPY_PHONE_BUTTON_ID);
    const mapsBtn = document.getElementById(OPEN_MAPS_BUTTON_ID);
    if (!emailBtn || !phoneBtn || !mapsBtn) return;

    if (newOrderId) {
        if (newOrderId !== currentOrderId) {
            // New order page detected, clear old data and fetch new.
            currentOrderId = newOrderId;
            orderData = null;
            fetchOrderData(newOrderId);
        }
    } else {
        // No longer on an order page.
        currentOrderId = null;
        orderData = null;
    }
    
    // Set visibility based on whether we have cached orderData.
    const shouldBeVisible = !!orderData;
    emailBtn.style.display = shouldBeVisible ? 'inline-block' : 'none';
    phoneBtn.style.display = shouldBeVisible ? 'inline-block' : 'none';
    mapsBtn.style.display = shouldBeVisible ? 'inline-block' : 'none';
}


/**
 * This function ONLY handles the phone number input check, running every second.
 */
function mainPhoneCheck() {
    const phoneInput = document.getElementById('phone');
    const container = document.getElementById(CONTAINER_ID);
    const resultText = document.getElementById(RESULT_ELEMENT_ID);
    if (!container || !resultText) return;

    if (!phoneInput || !phoneInput.value) {
        resultText.style.display = 'none';
        // Make the whole container disappear if neither part is visible
        if (document.getElementById(SET_ONLINE_BUTTON_ID)?.style.display === 'none' && !currentOrderId) {
            container.style.visibility = 'hidden';
            container.style.opacity = '0';
        }
        return;
    }

    // If we are here, it means the phone input has value, so the panel should be visible.
    resultText.style.display = 'block';
    container.style.visibility = 'visible';
    container.style.opacity = '1';

    const currentPhoneNumber = phoneInput.value;
    const savedPhone = localStorage.getItem('savedPhoneNumber');
    const savedText = localStorage.getItem('savedDisplayText');

    if (currentPhoneNumber === savedPhone && savedText) {
        resultText.textContent = savedText;
    } else {
        const url = `https://livry.flexi-apps.com/api/v1/admin/users?%24filter=%7B%22q%22%3A%22${currentPhoneNumber}%22%7D`;
        fetch(url).then(res => res.json()).then(data => {
            let displayText = 'Resto PLUS (+)';
            if (data.value && data.value.length > 0) {
                const total = data.value.reduce((sum, user) => sum + user.ordersCount, 0);
                displayText = `Orders: ${total}`;
            }
            localStorage.setItem('savedDisplayText', displayText);
            localStorage.setItem('savedPhoneNumber', currentPhoneNumber);
            resultText.textContent = displayText;
        });
    }
}

// --- EXECUTION ---

// 1. Build the UI as soon as the script runs.
initializeUI();

// 2. Start the MutationObserver to watch for DOM changes.
const observer = new MutationObserver(updateContextualButtonsVisibility);
observer.observe(document.body, { childList: true, subtree: true });

// 3. Run the checks once at the start to set the initial state.
updateContextualButtonsVisibility();
mainPhoneCheck();

// 4. Start the timed loop ONLY for the phone input value.
setInterval(mainPhoneCheck, 1000);

console.log("✅ Livry Super Toolkit (Stabilized) is running...");
