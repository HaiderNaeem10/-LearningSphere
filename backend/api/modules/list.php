<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

include_once '../../config/Database.php';

$database = new Database();
$db = $database->getConnection();

$course_id = isset($_GET['course_id']) ? intval($_GET['course_id']) : null;

if (!$course_id) {
    http_response_code(400);
    echo json_encode(["message" => "Course ID is required."]);
    exit;
}

$stmt = $db->prepare("SELECT m.id, m.course_id, m.title, m.order_index, m.prerequisite_module_id,
                             pm.title as prerequisite_title,
                             (SELECT COUNT(*) FROM lessons WHERE module_id = m.id) as total_lessons
                      FROM modules m
                      LEFT JOIN modules pm ON m.prerequisite_module_id = pm.id
                      WHERE m.course_id = ?
                      ORDER BY m.order_index ASC");
$stmt->execute([$course_id]);
$modules = $stmt->fetchAll(PDO::FETCH_ASSOC);

http_response_code(200);
echo json_encode($modules);
?>