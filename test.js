(function monitorUrl() {
    const targetUrls = [
        "https://livry.flexi-apps.com/#/partnerOrders",
        "https://livry.flexi-apps.com/#/orders"
    ];

    // Flag to ensure the button is clicked only once
    let clicked = false;

    function checkUrl() {
        const currentUrl = window.location.href;
        if (targetUrls.includes(currentUrl)) {
            console.log("Current URL matches one of the target URLs:", currentUrl);
            if (!clicked) {
                const button = document.querySelector('button'); // Modify the selector if needed to target a specific button
                if (button) {
                    console.log("Button found, clicking it...");
                    button.click();
                    clicked = true; // Set flag to true to prevent further clicks
                } else {
                    console.log("Button not found.");
                }
            }
        } else {
            console.log("Current URL does not match the target URLs:", currentUrl);
        }
    }

    // Check the URL immediately
    checkUrl();

    // Monitor for changes in the URL
    let lastUrl = window.location.href;
    setInterval(() => {
        if (lastUrl !== window.location.href) {
            lastUrl = window.location.href;
            checkUrl();
        }
    }, 500); // Check every 500ms
})();
