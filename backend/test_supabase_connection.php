
<?php

try {
    $config = require __DIR__ . '/config/Supabase.php';

    $url = $config['url'] . '/rest/v1/profiles?select=id&limit=1';

    $ch = curl_init($url);

    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
       CURLOPT_HTTPHEADER => [
    'apikey: ' . $config['key'],
    'Authorization: Bearer ' . $config['key']
],
        CURLOPT_TIMEOUT => 15
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

    if ($response === false) {
        echo "Connection error. Please check cURL configuration.";
    } else {
        echo "HTTP Status: " . $httpCode;
        echo "\nResponse: " . $response;

        if ($httpCode === 200) {
            echo "\nSupabase connection successful!";
        } else {
            echo "\nSupabase returned an error. HTTP status needs checking.";
        }
    }

    curl_close($ch);

} catch (Throwable $e) {
    echo "Configuration error.";
}
