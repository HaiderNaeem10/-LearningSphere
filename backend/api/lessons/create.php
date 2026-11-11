<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../../config/Database.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if(!empty($data->module_id) && !empty($data->title)) {
    $module_id = intval($data->module_id);
    $title = htmlspecialchars(strip_tags($data->title));
    $description = !empty($data->description) ? htmlspecialchars(strip_tags($data->description)) : '';
    $duration = !empty($data->duration) ? intval($data->duration) : 15;
    $video_url = !empty($data->video_url) ? trim($data->video_url) : null;
    $text_content = !empty($data->text_content) ? trim($data->text_content) : '';
    $resource_url = !empty($data->resource_url) ? trim($data->resource_url) : null;
    $order_index = !empty($data->order_index) ? intval($data->order_index) : 1;

    $query = "INSERT INTO lessons (module_id, title, description, duration, video_url, text_content, resource_url, order_index, created_at) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())";
    $stmt = $db->prepare($query);

    if($stmt->execute([$module_id, $title, $description, $duration, $video_url, $text_content, $resource_url, $order_index])) {
        http_response_code(201);
        echo json_encode(["message" => "Lesson created successfully.", "id" => $db->lastInsertId()]);
    } else {
        http_response_code(503);
        echo json_encode(["message" => "Unable to create lesson."]);
    }
} else {
    http_response_code(400);
    echo json_encode(["message" => "Module ID and lesson title are required."]);
}
?>