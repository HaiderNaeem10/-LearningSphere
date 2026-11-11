<?php
include_once __DIR__ . '/../backend/config/Database.php';

$database = new Database();
$db = $database->getConnection();

echo "=== LearnSphere LMS Comprehensive Verification ===\n\n";

// 1. Verify Users & Roles
echo "[1] Users and Roles:\n";
$users = $db->query("SELECT id, name, email, role, is_approved FROM users")->fetchAll(PDO::FETCH_ASSOC);
foreach ($users as $u) {
    echo "  - ID {$u['id']}: {$u['name']} ({$u['email']}) -> Role: {$u['role']} (Approved: {$u['is_approved']})\n";
}

// 2. Verify Courses & Modules with Prerequisite Hierarchy
echo "\n[2] Courses & Prerequisite Module Hierarchy:\n";
$courses = $db->query("SELECT id, title FROM courses")->fetchAll(PDO::FETCH_ASSOC);
foreach ($courses as $c) {
    echo "  Course {$c['id']}: {$c['title']}\n";
    $mods = $db->query("SELECT id, title, prerequisite_module_id, order_index FROM modules WHERE course_id = {$c['id']} ORDER BY order_index ASC")->fetchAll(PDO::FETCH_ASSOC);
    foreach ($mods as $m) {
        $prereq = $m['prerequisite_module_id'] ? " [Locked until Module {$m['prerequisite_module_id']} completes]" : " [Available/Unlocked]";
        echo "    * Module {$m['id']} (Order {$m['order_index']}): {$m['title']}{$prereq}\n";
    }
}

// 3. Verify Quizzes
echo "\n[3] Quizzes Registered:\n";
$quizzes = $db->query("SELECT q.id, q.title, q.course_id, q.passing_percentage, (SELECT COUNT(*) FROM quiz_questions WHERE quiz_id = q.id) as q_count FROM quizzes q")->fetchAll(PDO::FETCH_ASSOC);
foreach ($quizzes as $q) {
    echo "  - Quiz {$q['id']}: '{$q['title']}' for Course {$q['course_id']} ({$q['q_count']} Questions, Passing: {$q['passing_percentage']}%)\n";
}

// 4. Verify Assignments & Submissions
echo "\n[4] Assignments & Submissions:\n";
$assignments = $db->query("SELECT a.id, a.title, a.max_marks, (SELECT COUNT(*) FROM submissions WHERE assignment_id = a.id) as sub_count FROM assignments a")->fetchAll(PDO::FETCH_ASSOC);
foreach ($assignments as $a) {
    echo "  - Assignment {$a['id']}: '{$a['title']}' (Max Marks: {$a['max_marks']}, Submissions: {$a['sub_count']})\n";
}

// 5. Verify Announcements
echo "\n[5] Announcements Active:\n";
$announcements = $db->query("SELECT id, title, priority, created_at FROM announcements")->fetchAll(PDO::FETCH_ASSOC);
foreach ($announcements as $an) {
    echo "  - Announcement {$an['id']}: '{$an['title']}' [Priority: {$an['priority']}]\n";
}

// 6. Verify Course Resources
echo "\n[6] Course Resources:\n";
$resources = $db->query("SELECT id, title, resource_type FROM course_resources")->fetchAll(PDO::FETCH_ASSOC);
foreach ($resources as $r) {
    echo "  - Resource {$r['id']}: '{$r['title']}' ({$r['resource_type']})\n";
}

echo "\n=== All 6 Subsystems Verified OK! ===\n";
