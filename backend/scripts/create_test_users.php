<?php
// create_test_users.php
// Run via: php backend/scripts/create_test_users.php
// This script creates three test accounts: student, instructor, admin.
// Password for all: TestPass123!

require_once __DIR__ . '/../config/Database.php';

$database = new Database();
$db = $database->getConnection();

$users = [
    [
        'name' => 'Test Student',
        'email' => 'student@example.com',
        'password' => 'TestPass123!',
        'role' => 'student'
    ],
    [
        'name' => 'Test Instructor',
        'email' => 'instructor@example.com',
        'password' => 'TestPass123!',
        'role' => 'instructor'
    ],
    [
        'name' => 'Test Admin',
        'email' => 'admin@example.com',
        'password' => 'TestPass123!',
        'role' => 'admin'
    ]
];

foreach ($users as $u) {
    // Check if user already exists
    $stmt = $db->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
    $stmt->execute([$u['email']]);
    if ($stmt->rowCount() > 0) {
        echo "User {$u['email']} already exists, skipping.\n";
        continue;
    }
    $hash = password_hash($u['password'], PASSWORD_BCRYPT);
    $insert = $db->prepare('INSERT INTO users (name, email, password_hash, role, is_approved) VALUES (?, ?, ?, ?, 1)');
    $insert->execute([$u['name'], $u['email'], $hash, $u['role']]);
    echo "Created {$u['role']} account: {$u['email']} with password '{$u['password']}'.\n";
}
?>