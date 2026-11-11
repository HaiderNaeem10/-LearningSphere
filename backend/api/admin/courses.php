<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../../config/Database.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $query = "SELECT c.id, c.title, c.difficulty, c.status, c.created_at,
                     cat.name as category_name, u.name as instructor_name, u.email as instructor_email,
                     (SELECT COUNT(*) FROM modules WHERE course_id = c.id) as total_modules,
                     (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id) as total_students,
                     (SELECT COUNT(*) FROM certificates WHERE course_id = c.id) as total_certificates
              FROM courses c
              LEFT JOIN categories cat ON c.category_id = cat.id
              LEFT JOIN users u ON c.instructor_id = u.id
              ORDER BY c.created_at DESC";
    $stmt = $db->prepare($query);
    $stmt->execute();
    $courses = $stmt->fetchAll(PDO::FETCH_ASSOC);

    http_response_code(200);
    echo json_encode($courses);
    exit;
}

if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"));
    $action = $data->action ?? '';

    if ($action === 'update_status') {
        $course_id = intval($data->course_id);
        $status = $data->status; // 'published', 'draft', 'rejected'
        if (in_array($status, ['published', 'draft', 'rejected'])) {
            $stmt = $db->prepare("UPDATE courses SET status = ? WHERE id = ?");
            if ($stmt->execute([$status, $course_id])) {
                http_response_code(200);
                echo json_encode(["message" => "Course status updated to '$status'."]);
            } else {
                http_response_code(500);
                echo json_encode(["message" => "Failed to update course status."]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["message" => "Invalid status value."]);
        }
        exit;
    }

    if ($action === 'delete') {
        $course_id = intval($data->course_id);
        $stmt = $db->prepare("DELETE FROM courses WHERE id = ?");
        if ($stmt->execute([$course_id])) {
            http_response_code(200);
            echo json_encode(["message" => "Course deleted successfully."]);
        } else {
            http_response_code(500);
            echo json_encode(["message" => "Failed to delete course."]);
        }
        exit;
    }

    http_response_code(400);
    echo json_encode(["message" => "Invalid action."]);
}
?>