<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../../config/Database.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if(!empty($data->course_id) && !empty($data->student_id)) {
    // Check if already enrolled
    $check_query = "SELECT id FROM enrollments WHERE student_id = ? AND course_id = ? LIMIT 1";
    $check_stmt = $db->prepare($check_query);
    $check_stmt->bindParam(1, $data->student_id);
    $check_stmt->bindParam(2, $data->course_id);
    $check_stmt->execute();

    if($check_stmt->rowCount() > 0) {
        http_response_code(400);
        echo json_encode(["message" => "Already enrolled in this course."]);
        exit;
    }

    $assigned_by = !empty($data->assigned_by) ? intval($data->assigned_by) : null;

    $query = "INSERT INTO enrollments (student_id, course_id, assigned_by, progress_percentage) VALUES (?, ?, ?, 0.00)";
    $stmt = $db->prepare($query);
    $stmt->bindParam(1, $data->student_id);
    $stmt->bindParam(2, $data->course_id);
    $stmt->bindParam(3, $assigned_by);

    if($stmt->execute()) {
        http_response_code(201);
        echo json_encode(["message" => "Successfully enrolled!"]);
    } else {
        http_response_code(503);
        echo json_encode(["message" => "Unable to enroll."]);
    }
} else {
    http_response_code(400);
    echo json_encode(["message" => "Incomplete data."]);
}
?>
