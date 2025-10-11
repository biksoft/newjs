'use strict';

// --- IDs & Selectors ---
const CONTAINER_ID = 'livry-tools-container';
const RESULT_ELEMENT_ID = 'persistent-orders-count-result';
const SET_ONLINE_BUTTON_ID = 'set-livreur-online-button';
const COPY_EMAIL_BUTTON_ID = 'copy-order-email-button';
const COPY_PHONE_BUTTON_ID = 'copy-order-phone-button';
const OPEN_MAPS_BUTTON_ID = 'open-order-maps-button';
const ACTIONS_PANEL_ID = 'livry-actions-panel';
const MENU_TOGGLE_ID = 'livry-menu-toggle';

const PRIMARY_RIDER_ID_SELECTOR = 'input[name="livreur"]';
const SECONDARY_RIDER_ID_SELECTOR = 'input[name="livreur._id"]';
const ORDER_ID_SOURCE_SELECTOR = 'a.form-tab[href^="#/orders/"]';
// New selector for the initial position anchor
const INITIAL_POSITION_ANCHOR_SELECTOR = 'hr.MuiDivider-root';


// --- Global State ---
let currentOrderId = null;
let orderData = null;
let isDragging = false;
let offsetX, offsetY;

/**
 * Creates the entire UI toolkit ONCE.
 */
function initializeUI() {
    if (document.getElementById(CONTAINER_ID)) return;

    // Inject CSS for smooth transitions and styling
    const styles = `
        #${CONTAINER_ID} {
            position: fixed;
            z-index: 9999;
            background-color: #ffffff;
            border-radius: 12px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            transition: opacity 0.3s ease-in-out;
            display: flex;
            flex-direction: column;
            align-items: flex-start;
        }
        #${MENU_TOGGLE_ID} {
            cursor: move;
            width: 50px;
            height: 50px;
            background-color: #4CAF50;
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            border: none;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        }
        #${ACTIONS_PANEL_ID} {
            display: flex;
            flex-direction: column;
            gap: 12px;
            padding: 15px;
            padding-top: 5px;
            max-height: 0;
            overflow: hidden;
            opacity: 0;
            transition: max-height 0.4s ease-out, opacity 0.3s ease-in, padding 0.3s ease;
        }
        #${CONTAINER_ID}.is-open #${ACTIONS_PANEL_ID} {
            max-height: 500px; /* A large enough value */
            opacity: 1;
            padding-top: 15px;
        }
    `;
    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);


    // 1. Create Main Container
    const container = document.createElement('div');
    container.id = CONTAINER_ID;

    // --- MODIFIED: Smart Initial Positioning ---
    const savedPosition = JSON.parse(localStorage.getItem('livryToolkitPosition'));
    const anchorElement = document.querySelector(INITIAL_POSITION_ANCHOR_SELECTOR);

    if (savedPosition) {
        // Priority 1: Use the user's last dragged position
        container.style.top = savedPosition.top;
        container.style.left = savedPosition.left;
    } else if (anchorElement) {
        // Priority 2: If no saved position, try to align with the divider
        const anchorRect = anchorElement.getBoundingClientRect();
        // Position it 10px below the divider
        container.style.top = `${anchorRect.bottom + 10}px`;
        container.style.left = `${anchorRect.left}px`;
    } else {
        // Priority 3: Fallback to bottom right if anchor is not found
        container.style.bottom = '20px';
        container.style.right = '20px';
    }


    // 2. Create Menu Toggle / Drag Handle
    const menuToggle = document.createElement('button');
    menuToggle.id = MENU_TOGGLE_ID;
    menuToggle.innerHTML = '⚙️';
    menuToggle.addEventListener('click', () => container.classList.toggle('is-open'));
    menuToggle.addEventListener('mousedown', startDrag);
    menuToggle.addEventListener('touchstart', startDrag, { passive: true });
    container.appendChild(menuToggle);


    // 3. Create Actions Panel (collapsible part)
    const actionsPanel = document.createElement('div');
    actionsPanel.id = ACTIONS_PANEL_ID;

    const resultElement = document.createElement('p');
    resultElement.id = RESULT_ELEMENT_ID;
    resultElement.style.cssText = 'color: red !important; font-weight: bold !important; font-size: 1.1rem !important; margin: 0 0 5px 0 !important; white-space: nowrap; border-bottom: 1px solid #eee; padding-bottom: 10px; width: 100%; display: none;';
    actionsPanel.appendChild(resultElement);

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
        button.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent menu from closing when a button is clicked
            config.onClick(button);
        });
        buttonGroup.appendChild(button);
    });

    actionsPanel.appendChild(buttonGroup);
    container.appendChild(actionsPanel);
    document.body.appendChild(container);
}

// --- DRAG AND DROP LOGIC ---
function startDrag(e) {
    isDragging = true;
    const container = document.getElementById(CONTAINER_ID);
    
    // Clear fixed bottom/right positioning to allow top/left to take over
    container.style.bottom = '';
    container.style.right = '';

    const rect = container.getBoundingClientRect();
    const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
    
    offsetX = clientX - rect.left;
    offsetY = clientY - rect.top;

    window.addEventListener('mousemove', drag);
    window.addEventListener('mouseup', stopDrag);
    window.addEventListener('touchmove', drag, { passive: true });
    window.addEventListener('touchend', stopDrag);
}

function drag(e) {
    if (!isDragging) return;
    const container = document.getElementById(CONTAINER_ID);
    const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;

    let newX = clientX - offsetX;
    let newY = clientY - offsetY;

    // Constrain to viewport
    newX = Math.max(0, Math.min(newX, window.innerWidth - container.offsetWidth));
    newY = Math.max(0, Math.min(newY, window.innerHeight - container.offsetHeight));
    
    container.style.left = `${newX}px`;
    container.style.top = `${newY}px`;
}

function stopDrag() {
    isDragging = false;
    const container = document.getElementById(CONTAINER_ID);

    // Save the final position
    localStorage.setItem('livryToolkitPosition', JSON.stringify({
        top: container.style.top,
        left: container.style.left
    }));

    window.removeEventListener('mousemove', drag);
    window.removeEventListener('mouseup', stopDrag);
    window.removeEventListener('touchmove', drag);
    window.removeEventListener('touchend', stopDrag);
}


// --- All other helper and logic functions remain the same ---
function extractOrderId(){const linkElement=document.querySelector(ORDER_ID_SOURCE_SELECTOR);if(!linkElement)return null;const urlParts=linkElement.href.split('/orders/');if(urlParts.length<2)return null;const orderId=urlParts[1].split('/')[0];return(orderId&&orderId.length===24)?orderId:null}
function extractLivreurId(){const primaryInput=document.querySelector(PRIMARY_RIDER_ID_SELECTOR);if(primaryInput&&primaryInput.value&&primaryInput.value.length===24){return primaryInput.value}const secondaryInput=document.querySelector(SECONDARY_RIDER_ID_SELECTOR);if(secondaryInput&&secondaryInput.value&&secondaryInput.value.length===24){return secondaryInput.value}return null}
async function fetchOrderData(orderId){console.log(`Fetching data for Order ID: ${orderId}...`);try{const url=`https://livry.flexi-apps.com/api/v1/admin/orders/${orderId}`;const response=await fetch(url);if(!response.ok)throw new Error(`HTTP error! Status: ${response.status}`);const data=await response.json();const restaurantInfo=data.restaurantInfo||{};const coordinates=data.clientLocation?.coordinates||restaurantInfo.location?.coordinates;if(!coordinates)throw new Error("Coordinates not found in order data.");orderData={email:restaurantInfo.email||"N/A",phone:restaurantInfo.phoneNumber||restaurantInfo.phone||"N/A",mapsLink:`https://www.google.com/maps/search/?api=1&query=${coordinates[1]},${coordinates[0]}`};console.log(`✅ Data fetched for order ${orderId}.`);updateContextualButtonsVisibility()}catch(error){console.error("❌ Error fetching order data:",error);orderData=null;updateContextualButtonsVisibility()}}
async function copyToClipboard(button,text,originalText){if(!text||text==="N/A"){button.textContent='❌ N/A';setTimeout(()=>button.textContent=originalText,2000);return}try{await navigator.clipboard.writeText(text);button.textContent='✅ Copied!'}catch(err){button.textContent='❌ Failed!'}setTimeout(()=>button.textContent=originalText,2000)}
async function handleSetOnline(button){const livreurId=extractLivreurId();if(!livreurId)return alert('Cannot find Rider ID.');const originalText=button.textContent;button.disabled=true;button.textContent='Processing...';try{const response=await fetch(`https://livry.flexi-apps.com/api/v1/admin/livreurs/${livreurId}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({status:"online"})});if(!response.ok)throw new Error(`API Error ${response.status}`);button.textContent='✅ Online Set';alert(`Rider ${livreurId} is now ONLINE.`)}catch(error){button.textContent='❌ Failed'}finally{button.disabled=false;setTimeout(()=>button.textContent=originalText,3000)}}
function updateContextualButtonsVisibility(){const setOnlineBtn=document.getElementById(SET_ONLINE_BUTTON_ID);if(setOnlineBtn){setOnlineBtn.style.display=extractLivreurId()?'inline-block':'none'}const newOrderId=extractOrderId();const emailBtn=document.getElementById(COPY_EMAIL_BUTTON_ID);const phoneBtn=document.getElementById(COPY_PHONE_BUTTON_ID);const mapsBtn=document.getElementById(OPEN_MAPS_BUTTON_ID);if(!emailBtn||!phoneBtn||!mapsBtn)return;if(newOrderId){if(newOrderId!==currentOrderId){currentOrderId=newOrderId;orderData=null;fetchOrderData(newOrderId)}}else{currentOrderId=null;orderData=null}const shouldBeVisible=!!orderData;emailBtn.style.display=shouldBeVisible?'inline-block':'none';phoneBtn.style.display=shouldBeVisible?'inline-block':'none';mapsBtn.style.display=shouldBeVisible?'inline-block':'none'}
function mainPhoneCheck(){const phoneInput=document.getElementById('phone');const container=document.getElementById(CONTAINER_ID);const resultText=document.getElementById(RESULT_ELEMENT_ID);if(!container||!resultText)return;if(!phoneInput||!phoneInput.value){resultText.style.display='none';return}resultText.style.display='block';const currentPhoneNumber=phoneInput.value;const savedPhone=localStorage.getItem('savedPhoneNumber');const savedText=localStorage.getItem('savedDisplayText');if(currentPhoneNumber===savedPhone&&savedText){resultText.textContent=savedText}else{const url=`https://livry.flexi-apps.com/api/v1/admin/users?%24filter=%7B%22q%22%3A%22${currentPhoneNumber}%22%7D`;fetch(url).then(res=>res.json()).then(data=>{let displayText='Resto PLUS (+)';if(data.value&&data.value.length>0){const total=data.value.reduce((sum,user)=>sum+user.ordersCount,0);displayText=`Orders: ${total}`}localStorage.setItem('savedDisplayText',displayText);localStorage.setItem('savedPhoneNumber',currentPhoneNumber);resultText.textContent=displayText})}}

// --- EXECUTION ---
initializeUI();
const observer = new MutationObserver(updateContextualButtonsVisibility);
observer.observe(document.body, { childList: true, subtree: true });
updateContextualButtonsVisibility();
mainPhoneCheck();
setInterval(mainPhoneCheck, 1000);

console.log("✅ Livry Super Toolkit (Smart Position) is running...");
