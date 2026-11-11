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
    $role = isset($_GET['role']) ? trim($_GET['role']) : null;
    $search = isset($_GET['search']) ? trim($_GET['search']) : null;

    $query = "SELECT u.id, u.name, u.email, u.role, u.is_approved, u.created_at,
                     (SELECT COUNT(*) FROM enrollments WHERE student_id = u.id) as enrolled_count,
                     (SELECT COUNT(*) FROM courses WHERE instructor_id = u.id) as authored_courses,
                     (SELECT COUNT(*) FROM certificates WHERE student_id = u.id) as certificates_count
              FROM users u WHERE 1=1";
    $params = [];

    if ($role) {
        $query .= " AND u.role = ?";
        $params[] = $role;
    }
    if ($search) {
        $query .= " AND (u.name LIKE ? OR u.email LIKE ?)";
        $params[] = "%$search%";
        $params[] = "%$search%";
    }
    $query .= " ORDER BY u.created_at DESC";

    $stmt = $db->prepare($query);
    $stmt->execute($params);
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    http_response_code(200);
    echo json_encode($users);
    exit;
}

if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"));
    $action = $data->action ?? '';

    if ($action === 'toggle_approval') {
        $user_id = intval($data->user_id);
        $is_approved = intval($data->is_approved);
        $stmt = $db->prepare("UPDATE users SET is_approved = ? WHERE id = ?");
        if ($stmt->execute([$is_approved, $user_id])) {
            http_response_code(200);
            echo json_encode(["message" => "User status updated successfully."]);
        } else {
            http_response_code(500);
            echo json_encode(["message" => "Failed to update user status."]);
        }
        exit;
    }

    if ($action === 'change_role') {
        $user_id = intval($data->user_id);
        $role = $data->role;
        if (in_array($role, ['student', 'instructor', 'admin'])) {
            $stmt = $db->prepare("UPDATE users SET role = ? WHERE id = ?");
            if ($stmt->execute([$role, $user_id])) {
                http_response_code(200);
                echo json_encode(["message" => "User role updated successfully."]);
            } else {
                http_response_code(500);
                echo json_encode(["message" => "Failed to update role."]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["message" => "Invalid role."]);
        }
        exit;
    }

    if ($action === 'create_user' || $action === 'add_member') {
        $name = trim($data->name ?? '');
        $email = trim($data->email ?? '');
        $password = trim($data->password ?? '');
        $role = trim($data->role ?? 'student');
        $is_approved = isset($data->is_approved) ? intval($data->is_approved) : 1;

        if (empty($name) || empty($email) || empty($password)) {
            http_response_code(400);
            echo json_encode(["message" => "Name, email, and password are required."]);
            exit;
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            echo json_encode(["message" => "Invalid email format."]);
            exit;
        }

        if (!in_array($role, ['student', 'instructor', 'admin'])) {
            http_response_code(400);
            echo json_encode(["message" => "Invalid role selected."]);
            exit;
        }

        if (strlen($password) < 6) {
            http_response_code(400);
            echo json_encode(["message" => "Password must be at least 6 characters."]);
            exit;
        }

        // Check if email already exists
        $check_stmt = $db->prepare("SELECT id FROM users WHERE email = ? LIMIT 1");
        $check_stmt->execute([$email]);
        if ($check_stmt->rowCount() > 0) {
            http_response_code(400);
            echo json_encode(["message" => "A user with this email address already exists."]);
            exit;
        }

        $password_hash = password_hash($password, PASSWORD_BCRYPT);
        $insert_stmt = $db->prepare("INSERT INTO users (name, email, password_hash, role, is_approved, created_at) VALUES (?, ?, ?, ?, ?, NOW())");
        if ($insert_stmt->execute([$name, $email, $password_hash, $role, $is_approved])) {
            $new_user_id = $db->lastInsertId();
            http_response_code(201);
            echo json_encode([
                "message" => "Member added successfully with {$role} access.",
                "user" => [
                    "id" => $new_user_id,
                    "name" => $name,
                    "email" => $email,
                    "role" => $role,
                    "is_approved" => $is_approved
                ]
            ]);
        } else {
            http_response_code(500);
            echo json_encode(["message" => "Database error: Failed to create member account."]);
        }
        exit;
    }

    if ($action === 'delete' || $action === 'delete_user') {
        $user_id = intval($data->user_id);
        $stmt = $db->prepare("DELETE FROM users WHERE id = ?");
        if ($stmt->execute([$user_id])) {
            http_response_code(200);
            echo json_encode(["message" => "User deleted successfully."]);
        } else {
            http_response_code(500);
            echo json_encode(["message" => "Failed to delete user."]);
        }
        exit;
    }

    http_response_code(400);
    echo json_encode(["message" => "Invalid action specified."]);
}
?>