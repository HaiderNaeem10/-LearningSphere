<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

include_once '../../config/Database.php';

$database = new Database();
$db = $database->getConnection();

$id = isset($_GET['id']) ? intval($_GET['id']) : die();
$student_id = isset($_GET['student_id']) ? intval($_GET['student_id']) : null;

$query = "SELECT a.id, a.course_id, a.title, a.description, a.deadline, a.max_marks, a.resource_url, a.created_at,
                 c.title as course_title, c.difficulty, cat.name as category_name, u.name as instructor_name
          FROM assignments a
          JOIN courses c ON a.course_id = c.id
          LEFT JOIN categories cat ON c.category_id = cat.id
          LEFT JOIN users u ON c.instructor_id = u.id
          WHERE a.id = ? LIMIT 0,1";

$stmt = $db->prepare($query);
$stmt->execute([$id]);
$assignment = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$assignment) {
    http_response_code(404);
    echo json_encode(["message" => "Assignment not found."]);
    exit;
}

// Student's own submission
$assignment["my_submission"] = null;
if ($student_id) {
    $subStmt = $db->prepare("SELECT id, file_url, submission_text, status, marks_obtained, feedback, submitted_at, graded_at
                            FROM submissions
                            WHERE assignment_id = ? AND student_id = ? LIMIT 0,1");
    $subStmt->execute([$id, $student_id]);
    $assignment["my_submission"] = $subStmt->fetch(PDO::FETCH_ASSOC) ?: null;
}

// All submissions (for instructor / admin)
$subsStmt = $db->prepare("SELECT s.id, s.student_id, s.file_url, s.submission_text, s.status, s.marks_obtained, s.feedback, s.submitted_at, s.graded_at,
                                 u.name as student_name, u.email as student_email
                          FROM submissions s
                          JOIN users u ON s.student_id = u.id
                          WHERE s.assignment_id = ?
                          ORDER BY s.submitted_at DESC");
$subsStmt->execute([$id]);
$assignment["submissions"] = $subsStmt->fetchAll(PDO::FETCH_ASSOC);

http_response_code(200);
echo json_encode($assignment);
?>