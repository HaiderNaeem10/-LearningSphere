<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../../config/Database.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->submission_id) && isset($data->marks_obtained)) {
    $submission_id = intval($data->submission_id);
    $marks_obtained = intval($data->marks_obtained);
    $feedback = !empty($data->feedback) ? trim($data->feedback) : '';

    $stmt = $db->prepare("UPDATE submissions SET marks_obtained = ?, feedback = ?, status = 'graded', graded_at = NOW() WHERE id = ?");
    if ($stmt->execute([$marks_obtained, $feedback, $submission_id])) {
        http_response_code(200);
        echo json_encode(["message" => "Submission graded successfully!"]);
    } else {
        http_response_code(500);
        echo json_encode(["message" => "Failed to update grade."]);
    }
} else {
    http_response_code(400);
    echo json_encode(["message" => "Submission ID and marks are required."]);
}
?>