
<?php

try {
    $config = require __DIR__ . '/config/Supabase.php';

    if (!empty($config['url']) && !empty($config['key'])) {
        echo "Supabase configuration loaded successfully!";
    } else {
        echo "Supabase configuration is incomplete.";
    }

} catch (Throwable $e) {
    echo "Configuration error: " . $e->getMessage();
}
