<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

include_once '../../config/Database.php';

$database = new Database();
$db = $database->getConnection();

$course_id = isset($_GET['course_id']) ? intval($_GET['course_id']) : null;
$student_id = isset($_GET['student_id']) ? intval($_GET['student_id']) : null;
$instructor_id = isset($_GET['instructor_id']) ? intval($_GET['instructor_id']) : null;

if ($student_id) {
    // All assignments for student's enrolled courses with submission status
    $query = "SELECT a.id, a.course_id, a.title, a.description, a.deadline, a.max_marks, a.resource_url, a.created_at,
                     c.title as course_title, c.difficulty, cat.name as category_name,
                     s.id as submission_id, s.status as submission_status, s.marks_obtained, s.feedback, s.submitted_at, s.submission_text, s.file_url
              FROM assignments a
              JOIN courses c ON a.course_id = c.id
              LEFT JOIN categories cat ON c.category_id = cat.id
              JOIN enrollments e ON (e.course_id = c.id AND e.student_id = ?)
              LEFT JOIN submissions s ON (s.assignment_id = a.id AND s.student_id = ?)
              ORDER BY a.deadline ASC";
    $stmt = $db->prepare($query);
    $stmt->execute([$student_id, $student_id]);
} elseif ($instructor_id) {
    // All assignments created by instructor's courses with submission counts
    $query = "SELECT a.id, a.course_id, a.title, a.description, a.deadline, a.max_marks, a.resource_url, a.created_at,
                     c.title as course_title,
                     (SELECT COUNT(*) FROM submissions WHERE assignment_id = a.id) as total_submissions,
                     (SELECT COUNT(*) FROM submissions WHERE assignment_id = a.id AND status = 'graded') as graded_submissions,
                     (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id) as total_students
              FROM assignments a
              JOIN courses c ON a.course_id = c.id
              WHERE c.instructor_id = ?
              ORDER BY a.deadline DESC";
    $stmt = $db->prepare($query);
    $stmt->execute([$instructor_id]);
} elseif ($course_id) {
    $query = "SELECT a.id, a.course_id, a.title, a.description, a.deadline, a.max_marks, a.resource_url, a.created_at,
                     c.title as course_title,
                     (SELECT COUNT(*) FROM submissions WHERE assignment_id = a.id) as total_submissions
              FROM assignments a
              JOIN courses c ON a.course_id = c.id
              WHERE a.course_id = ?
              ORDER BY a.deadline ASC";
    $stmt = $db->prepare($query);
    $stmt->execute([$course_id]);
} else {
    $query = "SELECT a.id, a.course_id, a.title, a.description, a.deadline, a.max_marks, a.resource_url, a.created_at,
                     c.title as course_title
              FROM assignments a
              JOIN courses c ON a.course_id = c.id
              ORDER BY a.created_at DESC";
    $stmt = $db->prepare($query);
    $stmt->execute();
}

$assignments = $stmt->fetchAll(PDO::FETCH_ASSOC);

http_response_code(200);
echo json_encode($assignments);
?>