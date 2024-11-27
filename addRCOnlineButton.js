// addRCOnlineButton.js

function waitForElement(selector, callback) {
    const element = document.querySelector(selector);
    if (element) {
        callback(element);
    } else {
        setTimeout(() => waitForElement(selector, callback), 500);
    }
}

function addRCOnlineButton(container) {
    // Create the new button dynamically
    const button = document.createElement('button');

    // Set button text and styles
    button.innerText = 'RC online';
    button.style.backgroundColor = '#007bff';
    button.style.color = 'white';
    button.style.fontSize = '16px';
    button.style.padding = '10px 20px';
    button.style.border = 'none';
    button.style.borderRadius = '4px';
    button.style.cursor = 'pointer';
    button.style.transition = 'background-color 0.3s ease, transform 0.2s ease';

    // Add hover effects
    button.onmouseover = function () {
        button.style.backgroundColor = '#0056b3';
        button.style.transform = 'scale(1.05)';
    };
    button.onmouseleave = function () {
        button.style.backgroundColor = '#007bff';
        button.style.transform = 'scale(1)';
    };

    // Add active click effect
    button.onmousedown = function () {
        button.style.backgroundColor = '#004085';
    };
    button.onmouseup = function () {
        button.style.backgroundColor = '#0056b3';
    };

    // Find existing buttons
    const profilButton = container.querySelector('button[aria-label="Profil"]');

    // Insert the new button before the Profil button
    if (profilButton) {
        container.insertBefore(button, profilButton);
    } else {
        console.warn('Could not locate the Profil button.');
    }

    // Define the request data
    const requestData = {
        location: {
            type: "Point",
            coordinates: [-7.6674231, 33.5313295]
        },
        rating: {
            count: 20,
            note: 4.5
        },
        stats: {
            in_search: { sum: 0, count: 0, avg: 0 },
            accepted: { sum: 1159, count: 6, avg: 193.17 },
            recuperated: { sum: 214, count: 2, avg: 107 },
            deposed: { sum: 673, count: 5, avg: 134.6 },
            expired: { sum: 482, count: 3, avg: 160.67 }
        },
        _id: "5fef37220b63c0111edee4b0",
        name: "Rider cleaning",
        status: "online",
        email: "livreur1@livry.com",
        username: "livreur1@livry.com",
        accountEnabled: true,
        notifEnabled: true,
        city: "651a72f7d7040557f14b20cc",
        provider: "local",
        roles: ["livreur"],
        isMale: true,
        oneSignalPlayerIds: [
            "6fbc22d9-ef08-4099-a9a4-0baaba2dd31b",
            "4f0592e8-ac84-4042-8ca6-6b34d6e3cf70",
            "1ffbbcda-b5f5-4b16-a2cd-ff0b9eb57cdf",
            "2cc8b9d9-5520-46f6-9171-1ee87c23ec54"
        ],
        balance: 800,
        last_location_date: "2024-11-04T15:33:24.438Z",
        picture: "603545380dcee319e9eddf0b",
        location_url: "https://www.google.com/maps/search/?api=1&query=33.5313295,-7.6674231"
    };

    // Attach click event to the button
    button.addEventListener('click', function () {
        fetch('https://livry.flexi-apps.com/api/v1/admin/livreurs/5fef37220b63c0111edee4b0', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Origin': 'https://livry.flexi-apps.com',
                'Referer': 'https://livry.flexi-apps.com/',
            },
            body: JSON.stringify(requestData)
        })
            .then(response => response.json())
            .then(data => {
                console.log('Request successful:', data);
                alert('Rider updated successfully!');
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Failed to update rider.');
            });
    });
}

// Wait for the container div to be available and then add the button
waitForElement('div.jss21', addRCOnlineButton);
