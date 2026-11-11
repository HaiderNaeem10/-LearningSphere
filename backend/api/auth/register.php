<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../../config/Database.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if(!empty($data->name) && !empty($data->email) && !empty($data->password) && !empty($data->role)) {
    // Validate email
    if (!filter_var($data->email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(["message" => "Invalid email format."]);
        exit;
    }

    // Check if email exists
    $check_query = "SELECT id FROM users WHERE email = :email LIMIT 0,1";
    $check_stmt = $db->prepare($check_query);
    $check_stmt->bindParam(':email', $data->email);
    $check_stmt->execute();

    if($check_stmt->rowCount() > 0) {
        http_response_code(400);
        echo json_encode(["message" => "Email already in use."]);
        exit;
    }

    // Insert user
    $query = "INSERT INTO users (name, email, password_hash, role, is_approved) VALUES (:name, :email, :password_hash, :role, :is_approved)";
    $stmt = $db->prepare($query);

    $name = htmlspecialchars(strip_tags($data->name));
    $email = htmlspecialchars(strip_tags($data->email));
    $role = htmlspecialchars(strip_tags($data->role));
    $password_hash = password_hash($data->password, PASSWORD_BCRYPT);
    
    // Instructors might need admin approval, for now let's auto-approve or set to true for demo
    $is_approved = ($role === 'instructor') ? 1 : 1; 

    $stmt->bindParam(":name", $name);
    $stmt->bindParam(":email", $email);
    $stmt->bindParam(":password_hash", $password_hash);
    $stmt->bindParam(":role", $role);
    $stmt->bindParam(":is_approved", $is_approved);

    if($stmt->execute()) {
        http_response_code(201);
        echo json_encode(["message" => "User registered successfully."]);
    } else {
        http_response_code(503);
        echo json_encode(["message" => "Unable to register user."]);
    }
} else {
    http_response_code(400);
    echo json_encode(["message" => "Unable to register user. Data is incomplete."]);
}
?>
