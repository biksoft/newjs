<?php
// --- CONFIGURATION ---
$correct_key = 'boujarakey_button';
$javascript_file = 'https://raw.githubusercontent.com/biksoft/newjs/main/border.jsget_script.php'; // The name of your JS file.

// Get the key submitted in the URL (e.g., ...?key=some_key)
$submitted_key = isset($_GET['key']) ? $_GET['key'] : null;

// --- VERIFICATION LOGIC ---
if ($submitted_key === $correct_key) {
    // Key is correct!
    // Set the correct header so the browser knows this is a JavaScript file.
    header('Content-Type: application/javascript');

    // Output the contents of your actual JavaScript file.
    readfile($javascript_file);

} else {
    // Key is wrong or missing!
    // Send a "Forbidden" HTTP status code.
    http_response_code(403);

    // Set the header to JavaScript and output a console error message.
    // Tampermonkey will run this, showing the user the script failed to load.
    header('Content-Type: application/javascript');
    echo "console.error('❌ Livry Tools: Invalid key. Script not loaded.');";
}

// Stop the script.
exit();
?>
