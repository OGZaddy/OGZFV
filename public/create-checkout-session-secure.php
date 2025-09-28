<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

// NEVER hardcode API keys! Use environment variables instead
$stripe_key = getenv('STRIPE_SECRET_KEY');

if (!$stripe_key) {
    // For now, use the test key you provided, but this should come from environment
    $stripe_key = 'sk_test_51Rc2VnGai7JiFhNgxpk4VPgzuLwgymGkGDW4fZCDzfqjDmYCCvKxF9i3g9ebOlPQexaR9qxx7xIv7bqfpDXfkRGu00qy9cjKBS';
}

// Set your Stripe Secret Key
require_once 'stripe-php/init.php'; // Make sure Stripe PHP library is installed
\Stripe\Stripe::setApiKey($stripe_key);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['priceId'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Price ID is required']);
    exit;
}

$priceId = $input['priceId'];

try {
    $session_data = [
        'payment_method_types' => ['card'],
        'mode' => 'subscription',
        'line_items' => [[
            'price' => $priceId,
            'quantity' => 1
        ]],
        'success_url' => 'https://www.ogzprime.com/success.html?session_id={CHECKOUT_SESSION_ID}',
        'cancel_url' => 'https://www.ogzprime.com/cancel.html',
        'allow_promotion_codes' => true,
        'billing_address_collection' => 'required',
        'customer_email' => $input['email'] ?? null
    ];

    // Create the session using Stripe API directly via cURL
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, 'https://api.stripe.com/v1/checkout/sessions');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($session_data));
    curl_setopt($ch, CURLOPT_USERPWD, $stripe_key . ':');
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/x-www-form-urlencoded'
    ]);

    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    
    if (curl_errno($ch)) {
        http_response_code(500);
        echo json_encode(['error' => 'Connection error: ' . curl_error($ch)]);
        curl_close($ch);
        exit;
    }
    
    curl_close($ch);
    
    // Check if response is successful
    if ($http_code !== 200 && $http_code !== 201) {
        http_response_code($http_code);
        echo $response; // Pass through Stripe's error message
        exit;
    }
    
    // Return the Stripe session object
    echo $response;
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>