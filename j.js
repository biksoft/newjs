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
// New Selector for the target position
const TARGET_ELEMENT_SELECTOR = 'hr.MuiDivider-root'; 

// --- Global State ---
let currentOrderId = null; // Track the current order page ID
let orderData = null; // Cache for the fetched order details

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
            // Corrected URL structure for Google Maps search with coordinates
            mapsLink: `https://www.google.com/maps/search/?api=1&query=${coordinates[1]},${coordinates[0]}`
        };
        console.log(`✅ Data fetched for order ${orderId}.`);
        updateOrderButtons(); // Update buttons with new data

    } catch (error) {
        console.error("❌ Error fetching order data:", error);
        orderData = null; // Clear cache on error
        updateOrderButtons();
    }
}


/**
 * Creates the entire UI toolkit ONCE and appends it to the target element.
 */
function initializeUI() {
    // We only proceed if the target element is available
    const targetElement = document.querySelector(TARGET_ELEMENT_SELECTOR);
    if (!targetElement || document.getElementById(CONTAINER_ID)) return;

    const container = document.createElement('div');
    container.id = CONTAINER_ID;
    // --- UPDATED CSS for Fixed Position & Mobile Responsiveness ---
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
        flex-direction: column !important; 
        align-items: flex-start !important;
        gap: 12px !important; 
        max-width: 90vw; /* Added for mobile responsiveness */
        width: auto;
        visibility: hidden; 
        opacity: 0;
        transition: visibility 0s, opacity 0.3s ease-in-out !important;
    `;

    const resultElement = document.createElement('p');
    resultElement.id = RESULT_ELEMENT_ID;
    resultElement.style.cssText = 'color: red !important; font-weight: bold !important; font-size: 1.1rem !important; margin: 0 0 5px 0 !important; white-space: nowrap; border-bottom: 1px solid #eee; padding-bottom: 10px; width: 100%;';
    container.appendChild(resultElement);

    const buttonGroup = document.createElement('div');
    // --- UPDATED CSS for Button Group ---
    buttonGroup.style.cssText = 'display: flex !important; gap: 10px !important; flex-wrap: wrap !important; justify-content: flex-start !important;';

    // --- Button Definitions ---
    const buttons = [
        // Order-Context Buttons (initially hidden)
        { id: OPEN_MAPS_BUTTON_ID, text: '🗺️ Maps', color: '#4299e1', hidden: true, onClick: () => window.open(orderData.mapsLink, '_blank') },
        { id: COPY_EMAIL_BUTTON_ID, text: '📧 Copy Email', color: '#38a169', hidden: true, onClick: (btn) => copyToClipboard(btn, orderData.email) },
        { id: COPY_PHONE_BUTTON_ID, text: '📞 Copy Phone', color: '#f6ad55', hidden: true, onClick: (btn) => copyToClipboard(btn, orderData.phone) },
        // Always-Visible Buttons
        { id: SET_ONLINE_BUTTON_ID, text: '🟢 Set Online', color: '#4CAF50', hidden: true, onClick: handleSetOnline }, // Also context-aware
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
        // --- UPDATED CSS for Buttons (Added width: 100% for full width on mobile wrap) ---
        button.style.cssText = `
            background-color: ${config.color} !important; color: white !important;
            padding: 8px 15px !important; border: none !important; border-radius: 8px !important;
            cursor: pointer !important; font-weight: 500 !important; font-size: 0.9rem !important;
            transition: background-color 0.3s ease !important;
            display: ${config.hidden ? 'none' : 'inline-block'};
            flex-grow: 1; /* Allows buttons to grow and fill space */
            min-width: fit-content; /* Prevents text cutting off */
        `;
        button.addEventListener('click', () => config.onClick(button));
        buttonGroup.appendChild(button);
    });

    container.appendChild(buttonGroup);
    // Append the container immediately AFTER the target element
    targetElement.parentNode.insertBefore(container, targetElement.nextSibling);
}

/**
 * Generic function to copy text to the clipboard and provide button feedback.
 * @param {HTMLElement} button The button that was clicked.
 * @param {string} text The text to copy.
 */
async function copyToClipboard(button, text) {
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
 * Executes the API call to set the rider's status to "online".
 * @param {HTMLElement} button The button that was clicked.
 */
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
        alert(`Failed to set status: ${error.message}`);
    } finally {
        button.disabled = false;
        setTimeout(() => button.textContent = originalText, 3000);
    }
}


/**
 * Shows or hides the order-specific buttons and updates their text.
 */
function updateOrderButtons() {
    const emailBtn = document.getElementById(COPY_EMAIL_BUTTON_ID);
    const phoneBtn = document.getElementById(COPY_PHONE_BUTTON_ID);
    const mapsBtn = document.getElementById(OPEN_MAPS_BUTTON_ID);
    if (!emailBtn || !phoneBtn || !mapsBtn) return;

    const shouldBeVisible = !!orderData; // True if orderData is not null

    emailBtn.style.display = shouldBeVisible ? 'inline-block' : 'none';
    phoneBtn.style.display = shouldBeVisible ? 'inline-block' : 'none';
    mapsBtn.style.display = shouldBeVisible ? 'inline-block' : 'none';
}

/**
 * Main check function that runs every second.
 */
function mainCheck() {
    // The initializeUI function is now idempotent and will create the UI if the target is found.
    initializeUI(); 

    // --- Section 1: Handle Order-Context Buttons (Maps, Email, Phone) ---
    const newOrderId = extractOrderId();
    if (newOrderId) {
        if (newOrderId !== currentOrderId) {
            // New order page detected, fetch its data.
            currentOrderId = newOrderId;
            orderData = null; // Clear old data
            updateOrderButtons(); // Hide buttons immediately
            fetchOrderData(newOrderId);
        } else if (orderData) {
            // We are on the same order page and have data, ensure buttons are visible.
            updateOrderButtons();
        }
    } else if (currentOrderId) {
        // We are no longer on an order page, clear data and hide buttons.
        currentOrderId = null;
        orderData = null;
        updateOrderButtons();
    }

    // --- Section 2: Handle Rider "Set Online" Button ---
    const setOnlineBtn = document.getElementById(SET_ONLINE_BUTTON_ID);
    if (setOnlineBtn) {
        setOnlineBtn.style.display = extractLivreurId() ? 'inline-block' : 'none';
    }

    // --- Section 3: Handle Customer Order History Panel ---
    const phoneInput = document.getElementById('phone');
    const container = document.getElementById(CONTAINER_ID);
    const resultText = document.getElementById(RESULT_ELEMENT_ID);

    // If on a page without the phone input, hide the entire tool container for better UX.
    if (!phoneInput || !phoneInput.value) {
        if(container) {
            container.style.visibility = 'hidden';
            container.style.opacity = '0';
        }
        if(resultText) resultText.style.display = 'none'; // Hide the text part
        return;
    }
    
    // Show the container and result text when phone input is found.
    if(resultText) resultText.style.display = 'block'; 
    if(container) {
        container.style.visibility = 'visible';
        container.style.opacity = '1';
    }

    const currentPhoneNumber = phoneInput.value;
    const savedPhone = localStorage.getItem('savedPhoneNumber');
    const savedText = localStorage.getItem('savedDisplayText');

    if (currentPhoneNumber === savedPhone && savedText) {
        if(resultText) resultText.textContent = savedText;
    } else {
        // This is a simple API search, no need for async/await here
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
            });
    }
}

// --- EXECUTION ---
mainCheck(); // Run once immediately.
setInterval(mainCheck, 1000); // Check for updates every second.

console.log("✅ Livry Super Toolkit is running...");
