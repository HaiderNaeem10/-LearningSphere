<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

include_once '../../config/Database.php';

$database = new Database();
$db = $database->getConnection();

$course_id = isset($_GET['course_id']) ? intval($_GET['course_id']) : null;
$user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : null;

if ($course_id) {
    $stmt = $db->prepare("SELECT a.id, a.title, a.content, a.priority, a.created_at, a.course_id,
                                 c.title as course_title, u.name as author_name, u.role as author_role
                          FROM announcements a
                          LEFT JOIN courses c ON a.course_id = c.id
                          JOIN users u ON a.author_id = u.id
                          WHERE a.course_id = ? OR a.course_id IS NULL
                          ORDER BY a.created_at DESC");
    $stmt->execute([$course_id]);
} elseif ($user_id) {
    // Announcements for all enrolled courses + platform-wide
    $stmt = $db->prepare("SELECT a.id, a.title, a.content, a.priority, a.created_at, a.course_id,
                                 c.title as course_title, u.name as author_name, u.role as author_role
                          FROM announcements a
                          LEFT JOIN courses c ON a.course_id = c.id
                          JOIN users u ON a.author_id = u.id
                          WHERE a.course_id IS NULL 
                             OR a.course_id IN (SELECT course_id FROM enrollments WHERE student_id = ?)
                             OR a.course_id IN (SELECT id FROM courses WHERE instructor_id = ?)
                          ORDER BY a.created_at DESC");
    $stmt->execute([$user_id, $user_id]);
} else {
    // All announcements (for admin or public)
    $stmt = $db->prepare("SELECT a.id, a.title, a.content, a.priority, a.created_at, a.course_id,
                                 c.title as course_title, u.name as author_name, u.role as author_role
                          FROM announcements a
                          LEFT JOIN courses c ON a.course_id = c.id
                          JOIN users u ON a.author_id = u.id
                          ORDER BY a.created_at DESC");
    $stmt->execute();
}

$announcements = $stmt->fetchAll(PDO::FETCH_ASSOC);

http_response_code(200);
echo json_encode($announcements);
?>