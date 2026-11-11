<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../../config/Database.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->course_id) && !empty($data->title) && !empty($data->description) && !empty($data->deadline)) {
    $course_id = intval($data->course_id);
    $title = htmlspecialchars(strip_tags($data->title));
    $description = $data->description; // Allow rich text/markdown
    $deadline = $data->deadline;
    $max_marks = !empty($data->max_marks) ? intval($data->max_marks) : 100;
    $resource_url = !empty($data->resource_url) ? htmlspecialchars(strip_tags($data->resource_url)) : null;

    $stmt = $db->prepare("INSERT INTO assignments (course_id, title, description, deadline, max_marks, resource_url, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())");
    if ($stmt->execute([$course_id, $title, $description, $deadline, $max_marks, $resource_url])) {
        $assignment_id = $db->lastInsertId();
        http_response_code(201);
        echo json_encode([
            "message" => "Assignment created successfully.",
            "assignment_id" => $assignment_id
        ]);
    } else {
        http_response_code(500);
        echo json_encode(["message" => "Failed to create assignment."]);
    }
} else {
    http_response_code(400);
    echo json_encode(["message" => "Course, title, description and deadline are required."]);
}
?>