<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../../config/Database.php';

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    http_response_code(500);
    echo json_encode(["message" => "Database connection error."]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $action = $_GET['action'] ?? '';

    // 1. Get history of courses issued by a specific instructor
    if ($action === 'issued_by_instructor') {
        $instructor_id = isset($_GET['instructor_id']) ? intval($_GET['instructor_id']) : null;
        if (!$instructor_id) {
            http_response_code(400);
            echo json_encode(["message" => "Instructor ID required."]);
            exit;
        }

        $query = "SELECT e.id as enrollment_id, e.student_id, e.course_id, e.progress_percentage, 
                         e.enrolled_at, e.completed_at,
                         u.name as student_name, u.email as student_email,
                         c.title as course_title, c.difficulty
                  FROM enrollments e
                  JOIN users u ON e.student_id = u.id
                  JOIN courses c ON e.course_id = c.id
                  WHERE e.assigned_by = ?
                  ORDER BY e.enrolled_at DESC";
        $stmt = $db->prepare($query);
        $stmt->execute([$instructor_id]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        http_response_code(200);
        echo json_encode($rows);
        exit;
    }

    // 2. Default: Return all active students for dropdown / selection
    $search = isset($_GET['search']) ? trim($_GET['search']) : '';
    $query = "SELECT id, name, email, role, created_at,
                     (SELECT COUNT(*) FROM enrollments WHERE student_id = users.id) as enrolled_count
              FROM users 
              WHERE role = 'student' AND is_approved = 1";
    $params = [];

    if ($search !== '') {
        $query .= " AND (name LIKE ? OR email LIKE ?)";
        $params[] = "%$search%";
        $params[] = "%$search%";
    }

    $query .= " ORDER BY name ASC";
    $stmt = $db->prepare($query);
    $stmt->execute($params);
    $students = $stmt->fetchAll(PDO::FETCH_ASSOC);

    http_response_code(200);
    echo json_encode($students);
    exit;
}

if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"));

    if (empty($data->student_id) || empty($data->course_id) || empty($data->instructor_id)) {
        http_response_code(400);
        echo json_encode(["message" => "Student ID, Course ID, and Instructor ID are required."]);
        exit;
    }

    $student_id = intval($data->student_id);
    $course_id = intval($data->course_id);
    $instructor_id = intval($data->instructor_id);

    // Verify student exists
    $stCheck = $db->prepare("SELECT id, name, email FROM users WHERE id = ? LIMIT 1");
    $stCheck->execute([$student_id]);
    $student = $stCheck->fetch(PDO::FETCH_ASSOC);
    if (!$student) {
        http_response_code(404);
        echo json_encode(["message" => "Student not found."]);
        exit;
    }

    // Verify course exists
    $coCheck = $db->prepare("SELECT id, title FROM courses WHERE id = ? LIMIT 1");
    $coCheck->execute([$course_id]);
    $course = $coCheck->fetch(PDO::FETCH_ASSOC);
    if (!$course) {
        http_response_code(404);
        echo json_encode(["message" => "Course not found."]);
        exit;
    }

    // Check if already enrolled
    $enCheck = $db->prepare("SELECT id, assigned_by FROM enrollments WHERE student_id = ? AND course_id = ? LIMIT 1");
    $enCheck->execute([$student_id, $course_id]);
    $existing = $enCheck->fetch(PDO::FETCH_ASSOC);

    if ($existing) {
        // If already enrolled, update assigned_by if not assigned
        if (empty($existing['assigned_by'])) {
            $upd = $db->prepare("UPDATE enrollments SET assigned_by = ? WHERE id = ?");
            $upd->execute([$instructor_id, $existing['id']]);
            http_response_code(200);
            echo json_encode([
                "message" => "Course '{$course['title']}' was already enrolled and is now explicitly assigned to {$student['name']}.",
                "status" => "updated"
            ]);
            exit;
        } else {
            http_response_code(400);
            echo json_encode(["message" => "Student is already enrolled in this course."]);
            exit;
        }
    }

    // Create new enrollment assigned by instructor
    $ins = $db->prepare("INSERT INTO enrollments (student_id, course_id, assigned_by, progress_percentage, enrolled_at) VALUES (?, ?, ?, 0.00, NOW())");
    if ($ins->execute([$student_id, $course_id, $instructor_id])) {
        http_response_code(201);
        echo json_encode([
            "message" => "Course '{$course['title']}' successfully issued & assigned to {$student['name']}!",
            "status" => "success",
            "student_name" => $student['name'],
            "student_email" => $student['email'],
            "course_title" => $course['title'],
            "enrollment_id" => $db->lastInsertId()
        ]);
    } else {
        http_response_code(500);
        echo json_encode(["message" => "Database error: Failed to issue course."]);
    }
    exit;
}
?>
