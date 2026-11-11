<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

include_once '../../config/Database.php';

$database = new Database();
$db = $database->getConnection();

$course_id = isset($_GET['course_id']) ? intval($_GET['course_id']) : die();

// Course Info
$c_stmt = $db->prepare("SELECT id, title, difficulty FROM courses WHERE id = ?");
$c_stmt->execute([$course_id]);
$course = $c_stmt->fetch(PDO::FETCH_ASSOC);

if (!$course) {
    http_response_code(404);
    echo json_encode(["message" => "Course not found."]);
    exit;
}

// Students enrolled
$st_stmt = $db->prepare("SELECT e.id as enrollment_id, e.student_id, e.progress_percentage, e.enrolled_at, e.completed_at,
                                u.name as student_name, u.email as student_email,
                                cert.unique_code as certificate_code
                         FROM enrollments e
                         JOIN users u ON e.student_id = u.id
                         LEFT JOIN certificates cert ON (cert.student_id = e.student_id AND cert.course_id = e.course_id)
                         WHERE e.course_id = ?
                         ORDER BY e.enrolled_at DESC");
$st_stmt->execute([$course_id]);
$students = $st_stmt->fetchAll(PDO::FETCH_ASSOC);

// Quizzes in this course
$q_stmt = $db->prepare("SELECT id, title, passing_percentage FROM quizzes WHERE course_id = ?");
$q_stmt->execute([$course_id]);
$quizzes = $q_stmt->fetchAll(PDO::FETCH_ASSOC);

// Assignments in this course
$a_stmt = $db->prepare("SELECT id, title, max_marks, deadline FROM assignments WHERE course_id = ?");
$a_stmt->execute([$course_id]);
$assignments = $a_stmt->fetchAll(PDO::FETCH_ASSOC);

$student_roster = [];
foreach ($students as $st) {
    $s_id = $st['student_id'];

    // Quiz scores for this student
    $quiz_scores = [];
    foreach ($quizzes as $q) {
        $qa_stmt = $db->prepare("SELECT score, total_marks, percentage, is_passed FROM quiz_attempts WHERE quiz_id = ? AND student_id = ? ORDER BY attempted_at DESC LIMIT 1");
        $qa_stmt->execute([$q['id'], $s_id]);
        $qa = $qa_stmt->fetch(PDO::FETCH_ASSOC);
        $quiz_scores[] = [
            "quiz_id" => $q['id'],
            "quiz_title" => $q['title'],
            "attempted" => (bool)$qa,
            "score" => $qa ? $qa['score'] : null,
            "total_marks" => $qa ? $qa['total_marks'] : null,
            "percentage" => $qa ? floatval($qa['percentage']) : null,
            "is_passed" => $qa ? (bool)$qa['is_passed'] : false
        ];
    }

    // Assignment submissions for this student
    $as_submissions = [];
    foreach ($assignments as $a) {
        $sub_stmt = $db->prepare("SELECT id, status, marks_obtained, feedback, submitted_at FROM submissions WHERE assignment_id = ? AND student_id = ? LIMIT 1");
        $sub_stmt->execute([$a['id'], $s_id]);
        $sub = $sub_stmt->fetch(PDO::FETCH_ASSOC);
        $as_submissions[] = [
            "assignment_id" => $a['id'],
            "assignment_title" => $a['title'],
            "max_marks" => $a['max_marks'],
            "submitted" => (bool)$sub,
            "submission_id" => $sub ? $sub['id'] : null,
            "status" => $sub ? $sub['status'] : 'pending',
            "marks_obtained" => $sub ? $sub['marks_obtained'] : null,
            "feedback" => $sub ? $sub['feedback'] : null
        ];
    }

    $student_roster[] = [
        "student_id" => $s_id,
        "name" => $st['student_name'],
        "email" => $st['student_email'],
        "enrollment_id" => $st['enrollment_id'],
        "progress_percentage" => floatval($st['progress_percentage']),
        "certificate_code" => $st['certificate_code'],
        "quizzes" => $quiz_scores,
        "assignments" => $as_submissions
    ];
}

http_response_code(200);
echo json_encode([
    "course" => $course,
    "quizzes" => $quizzes,
    "assignments" => $assignments,
    "roster" => $student_roster
]);
?>