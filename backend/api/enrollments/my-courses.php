<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

include_once '../../config/Database.php';

$database = new Database();
$db = $database->getConnection();

$student_id = isset($_GET['student_id']) ? intval($_GET['student_id']) : null;

if (!$student_id) {
    http_response_code(400);
    echo json_encode(["message" => "Student ID is required."]);
    exit;
}

$query = "SELECT e.id as enrollment_id, e.progress_percentage, e.enrolled_at, e.completed_at, e.assigned_by,
                 c.id as course_id, c.title, c.short_description, c.difficulty, c.thumbnail,
                 cat.name as category_name, u.name as instructor_name, u.email as instructor_email,
                 assigner.name as assigned_by_name, assigner.role as assigned_by_role,
                 cert.unique_code as certificate_code
          FROM enrollments e
          JOIN courses c ON e.course_id = c.id
          LEFT JOIN categories cat ON c.category_id = cat.id
          LEFT JOIN users u ON c.instructor_id = u.id
          LEFT JOIN users assigner ON e.assigned_by = assigner.id
          LEFT JOIN certificates cert ON (cert.student_id = e.student_id AND cert.course_id = c.id)
          WHERE e.student_id = ?
          ORDER BY e.enrolled_at DESC";

$stmt = $db->prepare($query);
$stmt->execute([$student_id]);
$courses = $stmt->fetchAll(PDO::FETCH_ASSOC);

http_response_code(200);
echo json_encode($courses);
?>
