/* FILENAME: livry-logic.js
   DESCRIPTION: Optimized V2.12 - Instant Load & Auto-Fix 404s
*/

(function() {
    'use strict';

    console.log("🚀 Livry External Script (Fast V2.12) Loaded");

    // --- Configuration ---
    let riderCalculationCache = {};
    let currentOrderId = null;
    let isProcessing = false; // Prevent double firing

    const CLEANING_RIDER_NAME = "Rider cleaning";
    const CLEANING_RIDER_ID = "5fef37220b63c0111edee4b0";
    const NUM_NEAR_RIDERS = 9;
    const DISPLAY_LIMIT = NUM_NEAR_RIDERS + 1;
    const ACTIVE_STATUSES = ['online', 'en_course'];

    // --- Utility Functions ---

    function calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth radius in km
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
        if (!hash) return null;

        // Logic: Try to detect ID and context from URL
        if (hash.includes('/orders/')) {
            const id = hash.split('/orders/')[1].split('/')[0].split('?')[0]; // Clean ID extraction
            if (id.length > 10) return { basePath: 'orders', orderId: id, targetId: 'livreur._id-helper-text' };
        }
        
        if (hash.includes('/partnerOrders/')) {
            const id = hash.split('/partnerOrders/')[1].split('/')[0].split('?')[0];
            if (id.length > 10) return { basePath: 'partnerOrders', orderId: id, targetId: 'livreur-helper-text' };
        }

        return null;
    }

    // --- API Interaction (With Fallback) ---

    async function getStoreCoordinates(basePath, orderId) {
        // First Attempt: Try the path derived from URL
        let url = `https://livry.flexi-apps.com/api/v1/admin/${basePath}/${orderId}`;
        
        try {
            let response = await fetch(url);
            
            // If 404, try the OTHER endpoint (Auto-fix logic)
            if (response.status === 404) {
                console.warn(`⚠️ 404 on ${basePath}, trying alternate endpoint...`);
                const altPath = (basePath === 'orders') ? 'partnerOrders' : 'orders';
                url = `https://livry.flexi-apps.com/api/v1/admin/${altPath}/${orderId}`;
                response = await fetch(url);
            }

            if (!response.ok) throw new Error(`API Error ${response.status}`);

            const data = await response.json();
            
            // Extract coordinates based on data structure
            if (data.restaurantInfo?.location?.coordinates) {
                return data.restaurantInfo.location.coordinates;
            } else if (data.collect_point?.location?.coordinates) {
                return data.collect_point.location.coordinates;
            }
            return null;

        } catch (e) {
            console.error("❌ Failed to fetch store location:", e);
            return null;
        }
    }

    // --- Rider Actions ---

    window.makeRiderOnline = async function(event, riderId) {
        if(event) { event.preventDefault(); event.stopPropagation(); }
        const btn = event.target;
        const originalText = btn.innerText;
        btn.innerText = "⏳";

        try {
            await fetch(`https://livry.flexi-apps.com/api/v1/admin/livreurs/${riderId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: "online" })
            });
            
            // Refresh immediately
            const info = getOrderInfoFromURL();
            if (info) {
                delete riderCalculationCache[info.orderId];
                findNearestOnlineRiders(info, true);
            }
        } catch (e) {
            alert("Error updating status");
        } finally {
            btn.innerText = originalText;
        }
    };

    window.assignRiderToOrder = async function(event, orderId, riderId, basePath) {
        if(event) { event.preventDefault(); event.stopPropagation(); }
        const btn = event.target;
        btn.innerText = "Assigning...";
        
        try {
            // Try assigning via the basePath first, if 404, try the other
            let response = await fetch(`https://livry.flexi-apps.com/api/v1/admin/${basePath}/${orderId}/assign`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ livreur: riderId })
            });

            if (response.status === 404) {
                const altPath = (basePath === 'orders') ? 'partnerOrders' : 'orders';
                response = await fetch(`https://livry.flexi-apps.com/api/v1/admin/${altPath}/${orderId}/assign`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ livreur: riderId })
                });
            }

            if (response.ok) {
                alert("✅ Assigned successfully!");
                location.reload(); // Refresh page to show change
            } else {
                alert("❌ Assignment failed. Check console.");
            }
        } catch (e) {
            console.error(e);
            alert("❌ Network error.");
        } finally {
            btn.innerText = "Assign";
        }
    };

    // --- UI Injection ---

    function injectRiderList(orderInfo, topRiders) {
        // Try to find target by ID, or fallback to querySelector for robustness
        let target = document.getElementById(orderInfo.targetId);
        if (!target) target = document.querySelector('#livreur-helper-text, #livreur\\._id-helper-text');
        
        if (!target) return;

        // Prevent duplicates
        if (target.querySelector('.rider-list-injected')) {
             target.querySelector('.rider-list-injected').remove();
        }

        target.style.color = '#1b5e20';
        target.innerHTML = ''; // Clear "Select a rider" text

        const container = document.createElement('div');
        container.className = 'rider-list-injected';
        container.style.cssText = "border: 1px solid #28a745; padding: 5px; background: #e8f5e9; border-radius: 4px; margin-top: 5px;";

        if (topRiders.length === 0) {
            container.innerHTML = '<b style="color:red">No Riders Found</b>';
            target.appendChild(container);
            return;
        }

        let html = `<div style="margin-bottom:4px; font-size:12px; color:#0056b3; font-weight:bold">🚀 Top Active Riders:</div>`;
        html += `<ul style="list-style:none; padding:0; margin:0;">`;

        topRiders.forEach((rider, idx) => {
            const isFixed = rider.id === CLEANING_RIDER_ID;
            const dist = isFixed ? 'Fixed' : rider.distanceKm.toFixed(2) + ' km';
            const color = rider.status === 'online' ? '#28a745' : '#007bff';
            
            // Action Buttons
            const btnAssign = `<button onclick="window.assignRiderToOrder(event, '${orderInfo.orderId}', '${rider.id}', '${orderInfo.basePath}')" style="background:#28a745; color:white; border:none; border-radius:3px; cursor:pointer; font-size:10px; padding:2px 5px; margin-left:5px;">Assign</button>`;
            
            const btnOnline = rider.status === 'en_course' ? `<button onclick="window.makeRiderOnline(event, '${rider.id}')" style="background:#ffc107; color:black; border:none; border-radius:3px; cursor:pointer; font-size:10px; padding:2px 5px; margin-left:5px;">Online</button>` : '';

            html += `
            <li style="display:flex; justify-content:space-between; align-items:center; margin-bottom:3px; font-size:11px;">
                <div>
                    <b>${idx+1}.</b> 
                    <span style="color:${color}; font-weight:bold;">${rider.name}</span>
                    <span style="color:#666; margin-left:3px;">(${dist})</span>
                </div>
                <div>${btnOnline}${btnAssign}</div>
            </li>`;
        });

        html += `</ul>`;
        container.innerHTML = html;
        target.appendChild(container);
    }

    // --- Core Logic ---

    async function findNearestOnlineRiders(orderInfo, force = false) {
        if (isProcessing && !force) return;
        isProcessing = true;

        const cacheKey = orderInfo.orderId;
        if (riderCalculationCache[cacheKey] && !force) {
            injectRiderList(orderInfo, riderCalculationCache[cacheKey]);
            isProcessing = false;
            return;
        }

        console.log("⚡ Fetching data for Order:", orderInfo.orderId);

        // 1. Get Store Location (Handles 404 internally)
        const coords = await getStoreCoordinates(orderInfo.basePath, orderInfo.orderId);
        
        if (!coords) {
            console.error("Could not find store coordinates (tried both endpoints).");
            injectRiderList(orderInfo, []);
            isProcessing = false;
            return;
        }

        const [storeLon, storeLat] = coords;

        // 2. Get Riders
        try {
            const riderResponse = await fetch('https://livry.flexi-apps.com/api/v1/admin/livreurs/locations?$filter={}&$skip=0&$sort={}&$top=100&range=[0,99]');
            const riderData = await riderResponse.json();
            
            let calculated = [];
            let fixedRiderStatus = 'offline';

            for (const r of riderData.value) {
                if (r._id === CLEANING_RIDER_ID) {
                    fixedRiderStatus = r.status;
                    continue;
                }
                
                if (ACTIVE_STATUSES.includes(r.status) && r.location?.coordinates?.length === 2) {
                    const dist = calculateDistance(storeLat, storeLon, r.location.coordinates[1], r.location.coordinates[0]);
                    calculated.push({ name: r.name, id: r._id, distanceKm: dist, status: r.status });
                }
            }

            calculated.sort((a, b) => a.distanceKm - b.distanceKm);
            const topList = calculated.slice(0, NUM_NEAR_RIDERS);

            // Add Fixed Rider
            topList.unshift({ name: CLEANING_RIDER_NAME, id: CLEANING_RIDER_ID, distanceKm: 0, status: fixedRiderStatus });

            if (topList.length > DISPLAY_LIMIT) topList.length = DISPLAY_LIMIT;

            riderCalculationCache[cacheKey] = topList;
            injectRiderList(orderInfo, topList);

        } catch (e) {
            console.error("Rider fetch error", e);
        }

        isProcessing = false;
    }

    // --- Instant Observer (The "Fast" Part) ---

    function startObserver() {
        // This observer watches the DOM and fires AS SOON as the helper text appears
        const observer = new MutationObserver((mutations) => {
            const info = getOrderInfoFromURL();
            if (info) {
                // Try to find the element
                const target = document.getElementById(info.targetId) || document.querySelector('#livreur-helper-text');
                
                // If element exists and we haven't injected yet (or ID changed)
                if (target && (!target.querySelector('.rider-list-injected') || currentOrderId !== info.orderId)) {
                    currentOrderId = info.orderId;
                    findNearestOnlineRiders(info);
                    
                    // Also attach listener to the Refresh Button if present
                    const refreshBtn = document.querySelector('[title="Actualiser"]');
                    if(refreshBtn && !refreshBtn.dataset.hooked) {
                        refreshBtn.dataset.hooked = "true";
                        refreshBtn.addEventListener('click', () => {
                            delete riderCalculationCache[info.orderId];
                            setTimeout(() => findNearestOnlineRiders(info, true), 500);
                        });
                    }
                }
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }

    // Start immediately
    startObserver();
    // Also run once in case we loaded late
    setTimeout(() => {
        const info = getOrderInfoFromURL();
        if(info) findNearestOnlineRiders(info);
    }, 500);

})();
