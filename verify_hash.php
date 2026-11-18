<?php
require_once 'backend/config/Database.php';

$db = (new Database())->getConnection();

$email = 'student@example.com';
$plain = 'TestPass123!';

$stmt = $db->prepare('SELECT password_hash FROM users WHERE email = ?');
$stmt->execute([$email]);
$row = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$row) {
    echo "User not found\n";
    exit;
}

echo password_verify($plain, $row['password_hash']) ? "Password OK\n" : "Password FAIL\n";
?>