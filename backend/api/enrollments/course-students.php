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

$query = "SELECT e.id as enrollment_id, e.progress_percentage, e.enrolled_at, e.completed_at,
                 u.id as student_id, u.name as student_name, u.email as student_email,
                 cert.unique_code as certificate_code
          FROM enrollments e
          JOIN users u ON e.student_id = u.id
          LEFT JOIN certificates cert ON (cert.student_id = e.student_id AND cert.course_id = e.course_id)
          WHERE e.course_id = ?
          ORDER BY e.enrolled_at DESC";

$stmt = $db->prepare($query);
$stmt->execute([$course_id]);
$students = $stmt->fetchAll(PDO::FETCH_ASSOC);

http_response_code(200);
echo json_encode($students);
?>
