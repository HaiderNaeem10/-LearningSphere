
<?php

$envPath = dirname(__DIR__) . '/.env';

if (!file_exists($envPath)) {
    throw new Exception("Backend .env file not found.");
}

$env = parse_ini_file($envPath, false, INI_SCANNER_RAW);

if (!$env) {
    throw new Exception("Unable to read backend .env file.");
}

$url = rtrim($env['SUPABASE_URL'] ?? '', '/');
$key = $env['SUPABASE_SECRET_KEY'] ?? '';

if (empty($url) || empty($key)) {
    throw new Exception("Supabase configuration is incomplete.");
}

return [
    'url' => $url,
    'key' => $key
];

