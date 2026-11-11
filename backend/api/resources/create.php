<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../../config/Database.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->course_id) && !empty($data->title) && !empty($data->resource_url)) {
    $course_id = intval($data->course_id);
    $title = htmlspecialchars(strip_tags($data->title));
    $resource_type = !empty($data->resource_type) ? $data->resource_type : 'pdf';
    $resource_url = htmlspecialchars(strip_tags($data->resource_url));
    $description = !empty($data->description) ? htmlspecialchars(strip_tags($data->description)) : '';

    $stmt = $db->prepare("INSERT INTO course_resources (course_id, title, resource_type, resource_url, description, created_at) VALUES (?, ?, ?, ?, ?, NOW())");
    if ($stmt->execute([$course_id, $title, $resource_type, $resource_url, $description])) {
        http_response_code(201);
        echo json_encode(["message" => "Resource added successfully."]);
    } else {
        http_response_code(500);
        echo json_encode(["message" => "Failed to add resource."]);
    }
} else {
    http_response_code(400);
    echo json_encode(["message" => "Course, title, and resource URL are required."]);
}
?>