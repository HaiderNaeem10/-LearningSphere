<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../../config/Database.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $db->query("SELECT cat.id, cat.name, cat.description, cat.created_at,
                               (SELECT COUNT(*) FROM courses WHERE category_id = cat.id) as course_count
                        FROM categories cat
                        ORDER BY cat.name ASC");
    $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);

    http_response_code(200);
    echo json_encode($categories);
    exit;
}

if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"));
    $action = $data->action ?? 'create';

    if ($action === 'create' && !empty($data->name)) {
        $name = htmlspecialchars(strip_tags($data->name));
        $description = !empty($data->description) ? htmlspecialchars(strip_tags($data->description)) : '';

        $stmt = $db->prepare("INSERT INTO categories (name, description, created_at) VALUES (?, ?, NOW())");
        if ($stmt->execute([$name, $description])) {
            http_response_code(201);
            echo json_encode(["message" => "Category created successfully.", "id" => $db->lastInsertId()]);
        } else {
            http_response_code(500);
            echo json_encode(["message" => "Failed to create category."]);
        }
        exit;
    }

    if ($action === 'delete' && !empty($data->id)) {
        $id = intval($data->id);
        $stmt = $db->prepare("DELETE FROM categories WHERE id = ?");
        if ($stmt->execute([$id])) {
            http_response_code(200);
            echo json_encode(["message" => "Category deleted."]);
        } else {
            http_response_code(500);
            echo json_encode(["message" => "Cannot delete category with associated courses."]);
        }
        exit;
    }

    http_response_code(400);
    echo json_encode(["message" => "Invalid request data."]);
}
?>