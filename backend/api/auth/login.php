<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../../config/Database.php';
include_once '../../middleware/JwtHandler.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if(!empty($data->email) && !empty($data->password)) {
    $query = "SELECT id, name, email, password_hash, role, is_approved FROM users WHERE email = :email LIMIT 0,1";
    $stmt = $db->prepare($query);
    
    $email = htmlspecialchars(strip_tags($data->email));
    $stmt->bindParam(':email', $email);
    $stmt->execute();

    if($stmt->rowCount() > 0) {
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        $password_hash = $row['password_hash'];

        if(password_verify($data->password, $password_hash)) {
            if($row['is_approved'] == 0) {
                http_response_code(403);
                echo json_encode(["message" => "Account not approved yet."]);
                exit;
            }

            $jwt = new JwtHandler();
            $token_data = [
                "id" => $row['id'],
                "name" => $row['name'],
                "email" => $row['email'],
                "role" => $row['role']
            ];
            $token = $jwt->encode($token_data);

            http_response_code(200);
            echo json_encode([
                "message" => "Login successful.",
                "token" => $token,
                "user" => $token_data
            ]);
        } else {
            http_response_code(401);
            echo json_encode(["message" => "Invalid email or password."]);
        }
    } else {
        http_response_code(401);
        echo json_encode(["message" => "Invalid email or password."]);
    }
} else {
    http_response_code(400);
    echo json_encode(["message" => "Unable to login. Data is incomplete."]);
}
?>
