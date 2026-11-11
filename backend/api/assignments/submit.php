<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../../config/Database.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->assignment_id) && !empty($data->student_id)) {
    $assignment_id = intval($data->assignment_id);
    $student_id = intval($data->student_id);
    $file_url = !empty($data->file_url) ? trim($data->file_url) : 'https://learnsphere.edu/submissions/online';
    $submission_text = !empty($data->submission_text) ? trim($data->submission_text) : '';

    if (empty($submission_text) && empty($data->file_url)) {
        http_response_code(400);
        echo json_encode(["message" => "Please provide submission text, repository link or file."]);
        exit;
    }

    // Check assignment deadline
    $asStmt = $db->prepare("SELECT deadline FROM assignments WHERE id = ?");
    $asStmt->execute([$assignment_id]);
    $deadline = $asStmt->fetchColumn();

    $status = 'submitted';
    if ($deadline && strtotime('now') > strtotime($deadline)) {
        $status = 'late';
    }

    // Check if submission already exists
    $subStmt = $db->prepare("SELECT id FROM submissions WHERE assignment_id = ? AND student_id = ?");
    $subStmt->execute([$assignment_id, $student_id]);
    $existing = $subStmt->fetch(PDO::FETCH_ASSOC);

    if ($existing) {
        $upStmt = $db->prepare("UPDATE submissions SET file_url = ?, submission_text = ?, status = ?, submitted_at = NOW() WHERE id = ?");
        $success = $upStmt->execute([$file_url, $submission_text, $status, $existing['id']]);
        $subId = $existing['id'];
    } else {
        $insStmt = $db->prepare("INSERT INTO submissions (assignment_id, student_id, file_url, submission_text, status, submitted_at) VALUES (?, ?, ?, ?, ?, NOW())");
        $success = $insStmt->execute([$assignment_id, $student_id, $file_url, $submission_text, $status]);
        $subId = $db->lastInsertId();
    }

    if ($success) {
        http_response_code(200);
        echo json_encode([
            "message" => "Assignment submitted successfully!",
            "status" => $status,
            "submission_id" => $subId
        ]);
    } else {
        http_response_code(500);
        echo json_encode(["message" => "Failed to submit assignment."]);
    }
} else {
    http_response_code(400);
    echo json_encode(["message" => "Assignment ID and student ID are required."]);
}
?>