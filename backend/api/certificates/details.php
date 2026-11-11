<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

include_once '../../config/Database.php';

$database = new Database();
$db = $database->getConnection();

$code = isset($_GET['code']) ? trim($_GET['code']) : null;
$course_id = isset($_GET['course_id']) ? intval($_GET['course_id']) : null;
$student_id = isset($_GET['student_id']) ? intval($_GET['student_id']) : null;

if ($code) {
    $stmt = $db->prepare("SELECT cert.unique_code, cert.issued_at,
                                 u.name as student_name, u.email as student_email,
                                 c.id as course_id, c.title as course_title, c.difficulty,
                                 cat.name as category_name,
                                 inst.name as instructor_name
                          FROM certificates cert
                          JOIN users u ON cert.student_id = u.id
                          JOIN courses c ON cert.course_id = c.id
                          LEFT JOIN categories cat ON c.category_id = cat.id
                          LEFT JOIN users inst ON c.instructor_id = inst.id
                          WHERE cert.unique_code = ? LIMIT 1");
    $stmt->execute([$code]);
} elseif ($course_id && $student_id) {
    $stmt = $db->prepare("SELECT cert.unique_code, cert.issued_at,
                                 u.name as student_name, u.email as student_email,
                                 c.id as course_id, c.title as course_title, c.difficulty,
                                 cat.name as category_name,
                                 inst.name as instructor_name
                          FROM certificates cert
                          JOIN users u ON cert.student_id = u.id
                          JOIN courses c ON cert.course_id = c.id
                          LEFT JOIN categories cat ON c.category_id = cat.id
                          LEFT JOIN users inst ON c.instructor_id = inst.id
                          WHERE cert.student_id = ? AND cert.course_id = ? LIMIT 1");
    $stmt->execute([$student_id, $course_id]);
} else {
    http_response_code(400);
    echo json_encode(["message" => "Certificate code or student & course ID required."]);
    exit;
}

$cert = $stmt->fetch(PDO::FETCH_ASSOC);

if ($cert) {
    http_response_code(200);
    echo json_encode($cert);
} else {
    http_response_code(404);
    echo json_encode(["message" => "Certificate not found or not yet earned."]);
}
?>
