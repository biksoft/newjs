'use strict';

// --- IDs & Selectors ---
const CONTAINER_ID = 'boujara-tools-container';
const RESULT_ELEMENT_ID = 'boujara-orders-count-result';
const SET_ONLINE_BUTTON_ID = 'boujara-set-online-button';
const COPY_EMAIL_BUTTON_ID = 'boujara-copy-email-button';
const COPY_PHONE_BUTTON_ID = 'boujara-copy-phone-button';
const OPEN_MAPS_BUTTON_ID = 'boujara-open-maps-button';
const COLLAPSIBLE_CONTENT_ID = 'boujara-collapsible-content';
const TOGGLE_BUTTON_ID = 'boujara-toggle-button';
const NEW_CLIENT_MSG_BUTTON_ID = 'boujara-new-client-button';

const PRIMARY_RIDER_ID_SELECTOR = 'input[name="livreur"]';
const SECONDARY_RIDER_ID_SELECTOR = 'input[name="livreur._id"]';

// --- Global State ---
let currentOrderId = null;
let orderData = null; // Cache for fetched order details

/**
 * Extracts the Order ID from the current URL hash.
 * This works on both /orders and /partnerOrders pages.
 * @returns {string|null}
 */
function extractOrderId() {
    const urlHash = window.location.hash;
    const match = urlHash.match(/\/([0-9a-f]{24})/);
    return (match && match[1]) ? match[1] : null;
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
    } catch (error) {
        console.error("❌ Error fetching order data:", error);
        orderData = null; // Clear cache on error
    }
}

/**
 * Creates the entire UI toolkit ONCE. It builds all elements,
 * and the main loop will handle showing/hiding them.
 */
function initializeUI() {
    if (document.getElementById(CONTAINER_ID)) return;

    const styles = `
        #${COLLAPSIBLE_CONTENT_ID} {
            max-height: 500px; overflow: hidden;
            transition: max-height 0.4s ease-out, padding 0.4s ease, opacity 0.3s ease-in; opacity: 1;
        }
        #${CONTAINER_ID}.is-collapsed #${COLLAPSIBLE_CONTENT_ID} {
            max-height: 0; padding-top: 0 !important; padding-bottom: 0 !important; opacity: 0;
        }
    `;
    const styleSheet = document.createElement("style");
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);

    const container = document.createElement('div');
    container.id = CONTAINER_ID;
    container.style.cssText = `
        position: fixed !important; top: 20px !important; right: 20px !important;
        z-index: 9999 !important; background-color: #ffffff !important;
        border-radius: 12px !important; box-shadow: 0 5px 15px rgba(0,0,0,0.2) !important;
        display: none; /* Initially hidden, mainCheck will show it */
        flex-direction: column !important;
    `;

    const header = document.createElement('div');
    header.style.cssText = 'display: flex; justify-content: space-between; align-items: center; width: 100%; padding: 10px 15px; border-bottom: 1px solid #eee;';
    const title = document.createElement('span');
    title.textContent = 'boujara Tools';
    title.style.fontWeight = 'bold';
    const toggleButton = document.createElement('button');
    toggleButton.id = TOGGLE_BUTTON_ID;
    toggleButton.textContent = '➖';
    toggleButton.style.cssText = 'background: #eee; border: none; border-radius: 50%; width: 24px; height: 24px; cursor: pointer; font-size: 16px;';
    toggleButton.addEventListener('click', () => {
        const isCollapsed = container.classList.toggle('is-collapsed');
        toggleButton.textContent = isCollapsed ? '➕' : '➖';
    });
    header.appendChild(title);
    header.appendChild(toggleButton);
    container.appendChild(header);

    const content = document.createElement('div');
    content.id = COLLAPSIBLE_CONTENT_ID;
    content.style.cssText = 'display: flex; flex-direction: column; gap: 12px; padding: 15px; align-items: flex-start;';

    const resultElement = document.createElement('p');
    resultElement.id = RESULT_ELEMENT_ID;
    resultElement.style.cssText = 'color: red !important; font-weight: bold !important; font-size: 1.1rem !important; margin: 0; white-space: nowrap; width: 100%; display: none;';
    content.appendChild(resultElement);

    const buttonGroup = document.createElement('div');
    buttonGroup.style.cssText = 'display: flex !important; gap: 10px !important; flex-wrap: wrap !important;';
    const buttonStyle = `color: white !important; padding: 8px 15px !important; border: none !important; border-radius: 8px !important; cursor: pointer !important; font-weight: 500 !important; font-size: 0.9rem !important; transition: background-color 0.3s ease !important;`;

    // --- Create ALL buttons, initially hidden or visible as needed ---
    const buttons = [
        { id: OPEN_MAPS_BUTTON_ID, text: '🗺️ Maps', color: '#4299e1', display: 'none', onClick: () => window.open(orderData.mapsLink, '_blank') },
        { id: COPY_EMAIL_BUTTON_ID, text: '📧 Copy Email', color: '#38a169', display: 'none', onClick: (btn) => copyToClipboard(btn, orderData.email, '📧 Copy Email') },
        { id: COPY_PHONE_BUTTON_ID, text: '📞 Copy Phone', color: '#f6ad55', display: 'none', onClick: (btn) => copyToClipboard(btn, orderData.phone, '📞 Copy Phone') },
        { id: SET_ONLINE_BUTTON_ID, text: '🟢 Set Online', color: '#4CAF50', display: 'none', onClick: handleSetOnline },
        { id: NEW_CLIENT_MSG_BUTTON_ID, text: 'New Client Msg', color: '#4CAF50', display: 'inline-block', onClick: (btn) => {
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
        button.style.cssText = `background-color: ${config.color} !important; display: ${config.display}; ${buttonStyle}`;
        button.addEventListener('click', () => config.onClick(button));
        buttonGroup.appendChild(button);
    });

    content.appendChild(buttonGroup);
    container.appendChild(content);
    document.body.appendChild(container);
}

async function copyToClipboard(button, text, originalText) {
    if (!text || text === "N/A") {
        button.textContent = '❌ N/A';
        setTimeout(() => button.textContent = originalText, 2000);
        return;
    }
    const currentText = button.textContent;
    try {
        await navigator.clipboard.writeText(text);
        button.textContent = '✅ Copied!';
    } catch (err) {
        button.textContent = '❌ Failed!';
    }
    setTimeout(() => button.textContent = currentText, 2000);
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
 * This is the main "brain" of the script. It runs every second and
 * controls the visibility of the container and all its internal parts.
 */
function mainCheck() {
    initializeUI(); // Ensure UI is built

    const container = document.getElementById(CONTAINER_ID);
    const resultText = document.getElementById(RESULT_ELEMENT_ID);
    const phoneInput = document.getElementById('phone');
    const livreurId = extractLivreurId();
    const newOrderId = extractOrderId();

    const shouldContainerBeVisible = (phoneInput && phoneInput.value) || livreurId || newOrderId;

    if (!shouldContainerBeVisible) {
        container.style.display = 'none';
        currentOrderId = null; // Reset state when hidden
        orderData = null;
        return;
    }

    container.style.display = 'flex';

    // --- Control Phone Order History ---
    if (phoneInput && phoneInput.value) {
        resultText.style.display = 'block';
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
                    displayText = `Orders: ${data.value.reduce((sum, user) => sum + user.ordersCount, 0)}`;
                }
                localStorage.setItem('savedDisplayText', displayText);
                localStorage.setItem('savedPhoneNumber', currentPhoneNumber);
                resultText.textContent = displayText;
            });
        }
    } else {
        resultText.style.display = 'none';
    }

    // --- Control "Set Online" Button ---
    document.getElementById(SET_ONLINE_BUTTON_ID).style.display = livreurId ? 'inline-block' : 'none';

    // --- Control Order-Specific Buttons (Maps, Email, Phone) ---
    if (newOrderId) {
        if (newOrderId !== currentOrderId) {
            currentOrderId = newOrderId;
            orderData = null; // Clear data while fetching
            fetchOrderData(newOrderId);
        }
    } else {
        currentOrderId = null;
        orderData = null;
    }
    const shouldOrderButtonsBeVisible = !!orderData;
    document.getElementById(OPEN_MAPS_BUTTON_ID).style.display = shouldOrderButtonsBeVisible ? 'inline-block' : 'none';
    document.getElementById(COPY_EMAIL_BUTTON_ID).style.display = shouldOrderButtonsBeVisible ? 'inline-block' : 'none';
    document.getElementById(COPY_PHONE_BUTTON_ID).style.display = shouldOrderButtonsBeVisible ? 'inline-block' : 'none';
}

// --- EXECUTION ---
setInterval(mainCheck, 1000);

console.log("✅ boujara Tools (Stable & Fixed) is running...");
