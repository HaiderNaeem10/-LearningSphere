<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../../config/Database.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->title) && !empty($data->content) && !empty($data->author_id)) {
    $course_id = !empty($data->course_id) ? intval($data->course_id) : null;
    $author_id = intval($data->author_id);
    $title = htmlspecialchars(strip_tags($data->title));
    $content = htmlspecialchars(strip_tags($data->content));
    $priority = !empty($data->priority) ? $data->priority : 'normal';

    $stmt = $db->prepare("INSERT INTO announcements (course_id, author_id, title, content, priority, created_at) VALUES (?, ?, ?, ?, ?, NOW())");
    if ($stmt->execute([$course_id, $author_id, $title, $content, $priority])) {
        http_response_code(201);
        echo json_encode(["message" => "Announcement published successfully."]);
    } else {
        http_response_code(500);
        echo json_encode(["message" => "Failed to publish announcement."]);
    }
} else {
    http_response_code(400);
    echo json_encode(["message" => "Title, content and author are required."]);
}
?>