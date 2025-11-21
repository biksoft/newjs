'use strict';

// --- CONFIGURATION & GLOBAL STATE ---
let riderCalculationCache = {};
let currentOrderId = null;

// Rider and list config
const CLEANING_RIDER_NAME = "Rider cleaning";
const CLEANING_RIDER_ID = "5fef37220b63c0111edee4b0"; 
const NUM_NEAR_RIDERS = 9; 
const DISPLAY_LIMIT = NUM_NEAR_RIDERS + 1; 
const ACTIVE_STATUSES = ['online', 'en_course'];

// UI Element IDs
const REFRESH_BUTTON_TITLE = 'Actualiser';
const REFRESH_CHECK_INTERVAL = 1000;

// --- UTILITY FUNCTIONS ---

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; 
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; 
}

function getOrderInfoFromURL() {
    const hash = window.location.hash;
    
    if (hash.startsWith('#/orders/')) {
        const id = hash.substring('#/orders/'.length);
        if (id.length > 5 && /^[0-9a-f]+$/.test(id)) {
            return { basePath: 'orders', orderId: id, targetId: 'livreur._id-helper-text' };
        }
    } 
    
    else if (hash.startsWith('#/partnerOrders/')) {
        const id = hash.substring('#/partnerOrders/'.length);
        if (id.length > 5 && /^[0-9a-f]+$/.test(id)) {
            return { basePath: 'partnerOrders', orderId: id, targetId: 'livreur-helper-text' };
        }
    }
    
    return null;
}

// --- API LOGIC (Assignment and Status Update) ---

async function makeRiderOnline(event, riderId) {
    if (event && event.preventDefault) { event.preventDefault(); event.stopPropagation(); }

    const apiUrl = `https://livry.flexi-apps.com/api/v1/admin/livreurs/${riderId}`;
    try {
        const response = await fetch(apiUrl, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: "online" }) });

        if (response.ok) {
            alert(`✅ Rider ${riderId.substring(0, 8)}... status successfully updated to ONLINE.`);
            debouncedRun(true); 
        } else {
            const errorText = await response.text();
            alert(`❌ Failed to set rider status: HTTP ${response.status}`);
            console.error(`Failed to update rider status. HTTP Status: ${response.status}`, errorText);
        }
    } catch (error) {
        console.error('❌ Network error during status update:', error);
    }
}

async function assignRiderToOrder(event, orderId, riderId, basePath) {
    if (event && event.preventDefault) { event.preventDefault(); event.stopPropagation(); }

    const apiUrl = `https://livry.flexi-apps.com/api/v1/admin/${basePath}/${orderId}/assign`;
    
    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ livreur: riderId })
        });

        if (response.ok) {
            alert(`✅ Assignment Successful for ${basePath.toUpperCase()}!`);
            debouncedRun(true); 
        } else {
            const errorText = await response.text();
            alert(`❌ Assignment Failed: HTTP ${response.status}`);
            console.error(`Assignment failed. HTTP Status: ${response.status}`, errorText);
        }
    } catch (error) {
        console.error('❌ Network error during assignment:', error);
    }
}

// --- UI INJECTION & RENDERING ---

function injectRiderList(orderInfo, topRiders) {
    const helperTextElement = document.getElementById(orderInfo.targetId);
    
    if (!helperTextElement) return;

    // Check if our list is already injected by looking for the marker class
    if (helperTextElement.querySelector('.rider-list-injected')) return;

    // Clear native content and apply base styling
    helperTextElement.innerHTML = '';
    helperTextElement.style.cssText = 'color: #1b5e20; font-weight: bold; font-size: 12px;';
    
    const resultDiv = document.createElement('div');
    resultDiv.classList.add('rider-list-injected'); 
    resultDiv.style.cssText = 'border: 1px solid #007bff50; padding: 5px; border-radius: 3px; background-color: #e8f5e9;';


    if (topRiders.length > 0) {
        let htmlContent = `<strong style="color: #007bff; font-size: 13px;">Top ${topRiders.length} Active Riders:</strong><ul style="list-style: none; padding-left: 0; margin: 3px 0 0 0;">`;
        
        topRiders.forEach((rider, index) => {
            const isFixed = (rider.id === CLEANING_RIDER_ID);
            const distanceInfo = isFixed ? '(Fixed)' : `(${rider.distanceKm.toFixed(3)} km)`;
            
            let riderColor = '#1b5e20'; 
            if (isFixed) {
                riderColor = '#f57f17'; // Orange
            } else if (rider.status === 'en_course') {
                riderColor = '#007bff'; // Blue
            } else if (rider.status === 'online') {
                riderColor = '#28a745'; // Green
            }
            
            let goOnlineButton = '';
            if (rider.status === 'en_course') {
                goOnlineButton = `
                    <button 
                        onclick="window.makeRiderOnline(event, '${rider.id}')"
                        style="
                            background-color: #ffc107; color: black; border: none; border-radius: 4px; 
                            padding: 2px 6px; font-size: 10px; cursor: pointer; margin-left: 5px;
                            transition: background-color 0.2s;
                        "
                        onmouseover="this.style.backgroundColor='#e0a800'"
                        onmouseout="this.style.backgroundColor='#ffc107'"
                    >
                        Go Online
                    </button>`;
            }

            htmlContent += `
                <li style="margin-bottom: 5px; display: flex; align-items: center; justify-content: space-between;">
                    <div style="display: flex; align-items: center;">
                        <span style="font-weight: bold; margin-right: 5px;">${index + 1}.</span>
                        <span style="color: ${riderColor}; font-weight: bold; margin-right: 8px; ${isFixed ? 'text-decoration: underline;' : ''}">${rider.name}</span> 
                        <span style="font-weight: normal; color: #555; font-size: 11px; margin-right: 15px;">${distanceInfo}</span>
                        
                        ${goOnlineButton}
                        
                        <button 
                            onclick="window.assignRiderToOrder(event, '${orderInfo.orderId}', '${rider.id}', '${orderInfo.basePath}')"
                            style="
                                background-color: #28a745; color: white; border: none; border-radius: 4px; 
                                padding: 2px 6px; font-size: 10px; cursor: pointer;
                                transition: background-color 0.2s;
                            "
                            onmouseover="this.style.backgroundColor='#218838'"
                            onmouseout="this.style.backgroundColor='#28a745'"
                        >
                            Assign
                        </button>
                    </div>
                </li>
            `;
        });

        htmlContent += `</ul>`;
        resultDiv.innerHTML = htmlContent;
    } else {
        resultDiv.style.borderColor = '#c62828';
        resultDiv.style.backgroundColor = '#ffebee';
        resultDiv.innerHTML = '<span style="color: #c62828;">😔 **No active riders found.**</span>';
    }

    helperTextElement.appendChild(resultDiv);
}

// --- RIDER CALCULATION LOGIC ---

async function runRiderCalculation(orderInfo, forceRecalculation) {
    const cacheKey = orderInfo.orderId;
    const targetId = orderInfo.targetId;

    if (riderCalculationCache[cacheKey] && !forceRecalculation) {
        injectRiderList(orderInfo, riderCalculationCache[cacheKey]);
        return;
    }
    
    console.log(`\n🚀 Livry Rider Script: Calculating riders for ID: ${cacheKey} (First Run/F orced Recalculation).`);
    
    const oldInjected = document.querySelector(`#${targetId} .rider-list-injected`);
    if (oldInjected) oldInjected.remove();


    const restaurantApiUrl = `https://livry.flexi-apps.com/api/v1/admin/${orderInfo.basePath}/${orderInfo.orderId}`;
    const ridersApiUrl = 'https://livry.flexi-apps.com/api/v1/admin/livreurs/locations?$filter={}&$skip=0&$sort={}&$top=100&range=[0,99]';

    let restaurantLat, restaurantLon;
    try {
        const restoResponse = await fetch(restaurantApiUrl);
        const restoData = await restoResponse.json();
        
        let coordinates;
        if (orderInfo.basePath === 'orders') coordinates = restoData.restaurantInfo?.location?.coordinates;
        else if (orderInfo.basePath === 'partnerOrders') coordinates = restoData.collect_point?.location?.coordinates;

        if (!coordinates || coordinates.length < 2) {
            console.error('❌ Livry Rider Script: Could not find valid store coordinates.');
            return;
        }
        restaurantLon = coordinates[0]; 
        restaurantLat = coordinates[1];
    } catch (error) {
        console.error('❌ Livry Rider Script: Error fetching store data.', error);
        return;
    }

    let ridersData;
    try {
        const ridersResponse = await fetch(ridersApiUrl);
        ridersData = await ridersResponse.json();
    } catch (error) {
        console.error('❌ Livry Rider Script: Error fetching riders data.', error);
        return;
    }

    let calculatedRiders = [];
    let cleaningRiderStatus = 'offline';

    // 1. Calculate distances for all active riders (excluding the fixed one)
    for (const rider of ridersData.value) {
        if (rider._id === CLEANING_RIDER_ID) {
            cleaningRiderStatus = rider.status;
            continue; 
        } 
        
        const isActive = ACTIVE_STATUSES.includes(rider.status);
        const hasValidCoordinates = rider.location?.coordinates?.length === 2 && (rider.location.coordinates[0] !== 0 || rider.location.coordinates[1] !== 0);

        if (isActive && hasValidCoordinates) {
            const distance = calculateDistance(restaurantLat, restaurantLon, rider.location.coordinates[1], rider.location.coordinates[0]);

            calculatedRiders.push({ 
                name: rider.name, 
                id: rider._id, 
                distanceKm: distance,
                status: rider.status
            });
        }
    }
    
    // 2. Sort all calculated riders and take the top 9
    calculatedRiders.sort((a, b) => a.distanceKm - b.distanceKm);
    const top9Riders = calculatedRiders.slice(0, NUM_NEAR_RIDERS); 

    // 3. Create the fixed rider object
    const fixedRider = {
         name: CLEANING_RIDER_NAME, 
         id: CLEANING_RIDER_ID, 
         distanceKm: -1, 
         status: cleaningRiderStatus 
    };

    // 4. Combine: Fixed rider first (Rank #1), then the top 9 calculated riders
    const topRiders = [fixedRider, ...top9Riders];

    // 5. Final check on the total number of riders (max 10)
    if (topRiders.length > DISPLAY_LIMIT) {
         topRiders.length = DISPLAY_LIMIT;
    }

    riderCalculationCache[cacheKey] = topRiders;
    injectRiderList(orderInfo, topRiders);
}

// --- EXECUTION CONTROL ---

function mainRiderCheck(info, forceRecalculation = false) {
    
    const targetId = info.targetId;

    // Check if ID has changed
    if (info.orderId !== currentOrderId) {
        currentOrderId = info.orderId;
        console.log(`Livry Rider Script: Detail Page Detected: ${currentOrderId}`);
        // Clear the injection point immediately for new order ID
        const oldElement = document.getElementById(targetId);
        if(oldElement) oldElement.innerHTML = '';
    }
    
    // --- 1. Run Calculation/Injection ---
    runRiderCalculation(info, forceRecalculation); 
    
    // --- 2. Re-attach Listener (for persistence) ---
    const obs = new MutationObserver((mutationsList, observer) => {
        const refreshButton = document.querySelector(`[title="${REFRESH_BUTTON_TITLE}"].MuiIconButton-root`);
        
        if (refreshButton && !refreshButton.listenerAttached) {
            refreshButton.listenerAttached = true; 
            refreshButton.addEventListener('click', () => {
                console.log(`\n🔄 Refresh button clicked. Forcing recalculation for ID: ${info.orderId}`);
                delete riderCalculationCache[info.orderId];
                debouncedRun(true); 
            });
            console.log('Livry Rider Script: Attached click listener to "Actualiser" button.');
            observer.disconnect(); 
        }
        
        // Re-injection check (Persistence)
        const targetElement = document.getElementById(targetId);
        if (targetElement && !targetElement.querySelector('.rider-list-injected')) {
            // If the element was re-rendered and our list is gone, re-inject using cache
            observer.disconnect();
            injectRiderList(info, riderCalculationCache[info.orderId] || []);
            // Restart observer to watch for the next change
            observer.observe(document.body, { childList: true, subtree: true });
        }
    });
    
    // Start watching the body for changes
    obs.observe(document.body, { childList: true, subtree: true });
}

// --- INITIALIZATION ---

// Use debounced function to control execution flow without immediate calls
const debouncedRun = (() => {
    let timeout;
    return (forceRecalculation = false) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            const info = getOrderInfoFromURL();
            if (info) {
                mainRiderCheck(info, forceRecalculation);
            } else {
                currentOrderId = null;
            }
        }, 200); 
    };
})();

// Expose functions globally for inline HTML buttons
window.assignRiderToOrder = assignRiderToOrder;
window.makeRiderOnline = makeRiderOnline; 

// Listeners for SPA navigation and page load
window.addEventListener('hashchange', () => debouncedRun());
window.addEventListener('load', () => debouncedRun());

console.log("✅ Rider Locator (External Script) is loaded.");
