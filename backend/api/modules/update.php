<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../../config/Database.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->id) && !empty($data->title)) {
    $id = intval($data->id);
    $title = htmlspecialchars(strip_tags($data->title));
    $order_index = isset($data->order_index) ? intval($data->order_index) : 1;
    $prerequisite_module_id = !empty($data->prerequisite_module_id) ? intval($data->prerequisite_module_id) : null;

    // Prevent cyclic prerequisite
    if ($prerequisite_module_id === $id) {
        $prerequisite_module_id = null;
    }

    $stmt = $db->prepare("UPDATE modules SET title = ?, order_index = ?, prerequisite_module_id = ? WHERE id = ?");
    if ($stmt->execute([$title, $order_index, $prerequisite_module_id, $id])) {
        http_response_code(200);
        echo json_encode(["message" => "Module updated successfully."]);
    } else {
        http_response_code(500);
        echo json_encode(["message" => "Failed to update module."]);
    }
} else {
    http_response_code(400);
    echo json_encode(["message" => "Module ID and title are required."]);
}
?>