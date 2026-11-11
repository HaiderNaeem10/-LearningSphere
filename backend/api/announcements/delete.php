<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../../config/Database.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->id)) {
    $id = intval($data->id);
    $stmt = $db->prepare("DELETE FROM announcements WHERE id = ?");
    if ($stmt->execute([$id])) {
        http_response_code(200);
        echo json_encode(["message" => "Announcement deleted successfully."]);
    } else {
        http_response_code(500);
        echo json_encode(["message" => "Failed to delete announcement."]);
    }
} else {
    http_response_code(400);
    echo json_encode(["message" => "ID is required."]);
}
?>