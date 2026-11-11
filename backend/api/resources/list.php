<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

include_once '../../config/Database.php';

$database = new Database();
$db = $database->getConnection();

$course_id = isset($_GET['course_id']) ? intval($_GET['course_id']) : null;
$student_id = isset($_GET['student_id']) ? intval($_GET['student_id']) : null;

if ($course_id) {
    $stmt = $db->prepare("SELECT r.id, r.course_id, r.title, r.resource_type, r.resource_url, r.description, r.created_at,
                                 c.title as course_title
                          FROM course_resources r
                          JOIN courses c ON r.course_id = c.id
                          WHERE r.course_id = ?
                          ORDER BY r.id DESC");
    $stmt->execute([$course_id]);
} elseif ($student_id) {
    // All resources for student's enrolled courses
    $stmt = $db->prepare("SELECT r.id, r.course_id, r.title, r.resource_type, r.resource_url, r.description, r.created_at,
                                 c.title as course_title, c.difficulty, cat.name as category_name
                          FROM course_resources r
                          JOIN courses c ON r.course_id = c.id
                          LEFT JOIN categories cat ON c.category_id = cat.id
                          JOIN enrollments e ON (e.course_id = c.id AND e.student_id = ?)
                          ORDER BY r.created_at DESC");
    $stmt->execute([$student_id]);
} else {
    $stmt = $db->prepare("SELECT r.id, r.course_id, r.title, r.resource_type, r.resource_url, r.description, r.created_at,
                                 c.title as course_title
                          FROM course_resources r
                          JOIN courses c ON r.course_id = c.id
                          ORDER BY r.created_at DESC");
    $stmt->execute();
}

$resources = $stmt->fetchAll(PDO::FETCH_ASSOC);

http_response_code(200);
echo json_encode($resources);
?>