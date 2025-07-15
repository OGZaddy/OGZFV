<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Set your Stripe Secret Key
\Stripe\Stripe::setApiKey('sk_test_51Rc2VnGai7JiFhNgxpk4VPgzuLwgymGkGDW4fZCDzfqjDmYCCvKxF9i3g9ebOlPQexaR9qxx7xIv7bqfpDXfkRGu00qy9cjKBS');

header('Content-Type: application/json');

$input = json_decode(file_get_contents('php://input'), true);
$priceId = $input['priceId'];

$session_data = [
  'payment_method_types' => ['card'],
  'mode' => 'subscription',
  'line_items' => [[
    'price' => $priceId,
    'quantity' => 1
  ]],
  'success_url' => 'https://www.ogzprime.com/success.html',
  'cancel_url' => 'https://www.ogzprime.com/cancel.html'
];

// Send request to Stripe API using cURL
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'https://api.stripe.com/v1/checkout/sessions');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($session_data));
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_USERPWD, 'sk_test_51Rc2VnGai7JiFhNgxpk4VPgzuLwgymGkGDW4fZCDzfqjDmYCCvKxF9i3g9ebOlPQexaR9qxx7xIv7bqfpDXfkRGu00qy9cjKBS' . ':');
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/x-www-form-urlencoded']);

$response = curl_exec($ch);
if (curl_errno($ch)) {
    http_response_code(500);
    echo json_encode(['error' => curl_error($ch)]);
    exit;
}
curl_close($ch);

// Return the Stripe session object
echo $response;
?>
