<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../../config/Database.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->student_id) && !empty($data->course_id) && !empty($data->lesson_id)) {
    $student_id = intval($data->student_id);
    $course_id = intval($data->course_id);
    $lesson_id = intval($data->lesson_id);

    // 1. Get or create enrollment
    $enStmt = $db->prepare("SELECT id FROM enrollments WHERE student_id = ? AND course_id = ?");
    $enStmt->execute([$student_id, $course_id]);
    $enrollment = $enStmt->fetch(PDO::FETCH_ASSOC);

    if (!$enrollment) {
        $insEn = $db->prepare("INSERT INTO enrollments (student_id, course_id, progress_percentage, enrolled_at) VALUES (?, ?, 0, NOW())");
        $insEn->execute([$student_id, $course_id]);
        $enrollment_id = $db->lastInsertId();
    } else {
        $enrollment_id = $enrollment['id'];
    }

    // 2. Mark lesson as completed
    $checkProg = $db->prepare("SELECT id FROM lesson_progress WHERE enrollment_id = ? AND lesson_id = ?");
    $checkProg->execute([$enrollment_id, $lesson_id]);
    if ($checkProg->rowCount() == 0) {
        $insProg = $db->prepare("INSERT INTO lesson_progress (enrollment_id, lesson_id, is_completed, completed_at) VALUES (?, ?, 1, NOW())");
        $insProg->execute([$enrollment_id, $lesson_id]);
    } else {
        $upProg = $db->prepare("UPDATE lesson_progress SET is_completed = 1, completed_at = NOW() WHERE enrollment_id = ? AND lesson_id = ?");
        $upProg->execute([$enrollment_id, $lesson_id]);
    }

    // 3. Calculate updated progress
    // Total lessons in course
    $totStmt = $db->prepare("SELECT COUNT(*) FROM lessons WHERE module_id IN (SELECT id FROM modules WHERE course_id = ?)");
    $totStmt->execute([$course_id]);
    $total_lessons = intval($totStmt->fetchColumn());

    // Completed lessons
    $compStmt = $db->prepare("SELECT COUNT(*) FROM lesson_progress WHERE enrollment_id = ? AND is_completed = 1");
    $compStmt->execute([$enrollment_id]);
    $completed_lessons = intval($compStmt->fetchColumn());

    $progress = ($total_lessons > 0) ? round(($completed_lessons / $total_lessons) * 100, 2) : 100.00;

    // Update enrollment progress
    $upEn = $db->prepare("UPDATE enrollments SET progress_percentage = ? WHERE id = ?");
    $upEn->execute([$progress, $enrollment_id]);

    http_response_code(200);
    echo json_encode([
        "message" => "Lesson marked as completed.",
        "progress_percentage" => $progress,
        "completed_lessons" => $completed_lessons,
        "total_lessons" => $total_lessons
    ]);
} else {
    http_response_code(400);
    echo json_encode(["message" => "Incomplete request parameters."]);
}
?>
