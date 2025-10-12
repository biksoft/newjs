'use strict';

// --- IDs & Selectors ---
const CONTAINER_ID = 'livry-tools-container';
const RESULT_ELEMENT_ID = 'persistent-orders-count-result';
const SET_ONLINE_BUTTON_ID = 'set-livreur-online-button';
const COPY_EMAIL_BUTTON_ID = 'copy-order-email-button';
const COPY_PHONE_BUTTON_ID = 'copy-order-phone-button';
const OPEN_MAPS_BUTTON_ID = 'open-order-maps-button';
const ACTIONS_PANEL_ID = 'livry-actions-panel'; // The full panel
const MENU_TOGGLE_ID = 'livry-menu-toggle'; // The floating gear icon

const PRIMARY_RIDER_ID_SELECTOR = 'input[name="livreur"]';
const SECONDARY_RIDER_ID_SELECTOR = 'input[name="livreur._id"]';
const ORDER_ID_SOURCE_SELECTOR = 'a.form-tab[href^="#/orders/"]';

// --- Global State ---
let currentOrderId = null;
let orderData = null;

/**
 * Creates the entire UI toolkit ONCE.
 */
function initializeUI() {
    if (document.getElementById(CONTAINER_ID)) return;

    // Inject CSS for the new floating icon and popup panel
    const styles = `
        #${CONTAINER_ID} {
            position: fixed !important; top: 20px !important; right: 20px !important;
            z-index: 9999 !important;
            visibility: hidden; opacity: 0;
            transition: visibility 0s, opacity 0.3s ease-in-out !important;
        }
        #${MENU_TOGGLE_ID} {
            width: 50px; height: 50px; background-color: #4CAF50; color: white;
            border-radius: 50%; display: flex; align-items: center; justify-content: center;
            font-size: 24px; border: none; cursor: pointer;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        }
        #${ACTIONS_PANEL_ID} {
            position: absolute; bottom: calc(100% + 10px); right: 0; /* Position above the icon */
            background-color: #ffffff; border-radius: 12px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            width: 280px; /* Give it a fixed width */
            opacity: 0; transform: translateY(10px);
            transition: opacity 0.3s ease, transform 0.3s ease;
            pointer-events: none; /* Cant be clicked when hidden */
        }
        #${CONTAINER_ID}.is-open #${ACTIONS_PANEL_ID} {
            opacity: 1; transform: translateY(0);
            pointer-events: auto;
        }
    `;
    const styleSheet = document.createElement("style");
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);


    // --- Main Container (now just a wrapper for the icon and panel) ---
    const container = document.createElement('div');
    container.id = CONTAINER_ID;

    // --- Floating Icon (the gear) ---
    const menuToggle = document.createElement('button');
    menuToggle.id = MENU_TOGGLE_ID;
    menuToggle.textContent = '⚙️';
    menuToggle.addEventListener('click', () => {
        container.classList.toggle('is-open');
    });
    container.appendChild(menuToggle);

    // --- The Full Panel (appears on click) ---
    const actionsPanel = document.createElement('div');
    actionsPanel.id = ACTIONS_PANEL_ID;

    // Header with Title and Close Button
    const header = document.createElement('div');
    header.style.cssText = 'display: flex; justify-content: space-between; align-items: center; width: 100%; padding: 10px 15px; border-bottom: 1px solid #eee;';
    const title = document.createElement('span');
    title.textContent = 'Livry Tools';
    title.style.fontWeight = 'bold';
    const closeButton = document.createElement('button');
    closeButton.textContent = '➖';
    closeButton.style.cssText = 'background: #eee; border: none; border-radius: 50%; width: 24px; height: 24px; cursor: pointer; font-size: 16px; line-height: 24px;';
    closeButton.addEventListener('click', () => container.classList.remove('is-open')); // Specifically closes
    header.appendChild(title);
    header.appendChild(closeButton);
    actionsPanel.appendChild(header);

    // Content Area (buttons, etc.)
    const content = document.createElement('div');
    content.style.cssText = 'display: flex; flex-direction: column; gap: 12px; padding: 15px; align-items: flex-start;';
    
    const resultElement = document.createElement('p');
    resultElement.id = RESULT_ELEMENT_ID;
    resultElement.style.cssText = 'color: red !important; font-weight: bold !important; font-size: 1.1rem !important; margin: 0 0 5px 0 !important; white-space: nowrap; width: 100%; display: none;';
    content.appendChild(resultElement);

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

    content.appendChild(buttonGroup);
    actionsPanel.appendChild(content);
    container.appendChild(actionsPanel);
    document.body.appendChild(container);
}

// --- All other helper and logic functions remain the same ---
function extractOrderId(){const e=window.location.hash.match(/\/([0-9a-f]{24})/);if(e&&e[1])return e[1];const t=document.querySelector(ORDER_ID_SOURCE_SELECTOR);if(t){const e=t.href.split("/orders/");if(e.length>=2){const t=e[1].split("/")[0];if(t&&24===t.length)return t}}return null}
function extractLivreurId(){const e=document.querySelector(PRIMARY_RIDER_ID_SELECTOR);if(e&&e.value&&24===e.value.length)return e.value;const t=document.querySelector(SECONDARY_RIDER_ID_SELECTOR);return t&&t.value&&24===t.value.length?t.value:null}
async function fetchOrderData(e){console.log(`Fetching data for Order ID: ${e}...`);try{const t=await fetch(`https://livry.flexi-apps.com/api/v1/admin/orders/${e}`);if(!t.ok)throw new Error(`HTTP error! Status: ${t.status}`);const o=await t.json(),n=o.restaurantInfo||{},r=o.clientLocation?.coordinates||n.location?.coordinates;if(!r)throw new Error("Coordinates not found in order data.");orderData={email:n.email||"N/A",phone:n.phoneNumber||n.phone||"N/A",mapsLink:`https://www.google.com/maps/search/?api=1&query=$${${r[1]}},${r[0]}`},console.log(`✅ Data fetched for order ${e}.`),updateContextualButtonsVisibility()}catch(t){console.error("❌ Error fetching order data:",t),orderData=null,updateContextualButtonsVisibility()}}
async function copyToClipboard(e,t,o){if(!t||"N/A"===t)return e.textContent="❌ N/A",void setTimeout(()=>e.textContent=o,2e3);try{await navigator.clipboard.writeText(t),e.textContent="✅ Copied!"}catch(t){e.textContent="❌ Failed!"}setTimeout(()=>e.textContent=o,2e3)}
async function handleSetOnline(e){const t=extractLivreurId();if(!t)return alert("Cannot find Rider ID.");const o=e.textContent;e.disabled=!0,e.textContent="Processing...";try{const n=await fetch(`https://livry.flexi-apps.com/api/v1/admin/livreurs/${t}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({status:"online"})});if(!n.ok)throw new Error(`API Error ${n.status}`);e.textContent="✅ Online Set",alert(`Rider ${t} is now ONLINE.`)}catch(t){e.textContent="❌ Failed"}finally{e.disabled=!1,setTimeout(()=>e.textContent=o,3e3)}}
function updateContextualButtonsVisibility(){const e=document.getElementById(SET_ONLINE_BUTTON_ID);e&&(e.style.display=extractLivreurId()?"inline-block":"none");const t=extractOrderId(),o=document.getElementById(COPY_EMAIL_BUTTON_ID),n=document.getElementById(COPY_PHONE_BUTTON_ID),r=document.getElementById(OPEN_MAPS_BUTTON_ID);if(o&&n&&r){t?t!==currentOrderId&&(currentOrderId=t,orderData=null,fetchOrderData(t)):(currentOrderId=null,orderData=null);const e=!!orderData;o.style.display=e?"inline-block":"none",n.style.display=e?"inline-block":"none",r.style.display=e?"inline-block":"none"}}
function mainPhoneCheck(){const e=document.getElementById("phone"),t=document.getElementById(CONTAINER_ID),o=document.getElementById(RESULT_ELEMENT_ID);if(t&&o){if(!e||!e.value)return o.style.display="none",void(document.getElementById(SET_ONLINE_BUTTON_ID)?.style.display==="none"&&!currentOrderId&&(t.style.visibility="hidden",t.style.opacity="0"));o.style.display="block",t.style.visibility="visible",t.style.opacity="1";const n=e.value,r=localStorage.getItem("savedPhoneNumber"),i=localStorage.getItem("savedDisplayText");if(n===r&&i)o.textContent=i;else{const e=`https://livry.flexi-apps.com/api/v1/admin/users?%24filter=%7B%22q%22%3A%22${n}%22%7D`;fetch(e).then(e=>e.json()).then(e=>{let t="Resto PLUS (+)";e.value&&e.value.length>0&&(t=`Orders: ${e.value.reduce((e,t)=>e+t.ordersCount,0)}`),localStorage.setItem("savedDisplayText",t),localStorage.setItem("savedPhoneNumber",n),o.textContent=t})}}}

// --- EXECUTION ---
initializeUI();
const observer = new MutationObserver(updateContextualButtonsVisibility);
observer.observe(document.body, { childList: true, subtree: true });
updateContextualButtonsVisibility();
mainPhoneCheck();
setInterval(mainPhoneCheck, 1000);

console.log("✅ Livry Super Toolkit (Mobile Friendly FAB) is running...");
