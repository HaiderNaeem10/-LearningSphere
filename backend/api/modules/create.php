<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../../config/Database.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->course_id) && !empty($data->title)) {
    $course_id = intval($data->course_id);
    $title = htmlspecialchars(strip_tags($data->title));
    $order_index = !empty($data->order_index) ? intval($data->order_index) : 1;
    $prerequisite_module_id = !empty($data->prerequisite_module_id) ? intval($data->prerequisite_module_id) : null;

    $stmt = $db->prepare("INSERT INTO modules (course_id, title, order_index, prerequisite_module_id, created_at) VALUES (?, ?, ?, ?, NOW())");
    if ($stmt->execute([$course_id, $title, $order_index, $prerequisite_module_id])) {
        $id = $db->lastInsertId();
        http_response_code(201);
        echo json_encode(["message" => "Module created successfully.", "id" => $id]);
    } else {
        http_response_code(500);
        echo json_encode(["message" => "Failed to create module."]);
    }
} else {
    http_response_code(400);
    echo json_encode(["message" => "Course ID and module title are required."]);
}
?>