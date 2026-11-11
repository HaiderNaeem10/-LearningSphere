<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

include_once '../../config/Database.php';

$database = new Database();
$db = $database->getConnection();

$search = isset($_GET['search']) ? trim($_GET['search']) : null;
$category = isset($_GET['category']) ? trim($_GET['category']) : null;
$difficulty = isset($_GET['difficulty']) ? trim($_GET['difficulty']) : null;
$instructor_id = isset($_GET['instructor_id']) ? intval($_GET['instructor_id']) : null;

$query = "SELECT c.id, c.title, c.short_description, c.difficulty, c.thumbnail, c.status, c.created_at,
                 cat.id as category_id, cat.name as category_name,
                 u.id as instructor_id, u.name as instructor_name,
                 (SELECT COUNT(*) FROM modules WHERE course_id = c.id) as total_modules,
                 (SELECT COUNT(*) FROM lessons WHERE module_id IN (SELECT id FROM modules WHERE course_id = c.id)) as total_lessons,
                 (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id) as total_enrollments
          FROM courses c 
          LEFT JOIN categories cat ON c.category_id = cat.id 
          LEFT JOIN users u ON c.instructor_id = u.id
          WHERE (c.status = 'published' OR :inst_id IS NOT NULL)";

$params = [':inst_id' => $instructor_id];

if ($instructor_id) {
    $query .= " AND c.instructor_id = :instructor_filter";
    $params[':instructor_filter'] = $instructor_id;
}

if ($category && $category !== 'all') {
    $query .= " AND (cat.name = :cat_name OR cat.id = :cat_id)";
    $params[':cat_name'] = $category;
    $params[':cat_id'] = $category;
}

if ($difficulty && $difficulty !== 'all') {
    $query .= " AND c.difficulty = :diff";
    $params[':diff'] = $difficulty;
}

if ($search) {
    $query .= " AND (c.title LIKE :s1 OR c.short_description LIKE :s2 OR cat.name LIKE :s3 OR u.name LIKE :s4)";
    $params[':s1'] = "%$search%";
    $params[':s2'] = "%$search%";
    $params[':s3'] = "%$search%";
    $params[':s4'] = "%$search%";
}

$query .= " ORDER BY c.created_at DESC";

$stmt = $db->prepare($query);
$stmt->execute($params);

$courses_arr = array();

while ($row = $stmt->fetch(PDO::FETCH_ASSOC)){
    $courses_arr[] = array(
        "id" => intval($row['id']),
        "title" => $row['title'],
        "short_description" => $row['short_description'],
        "difficulty" => $row['difficulty'],
        "category" => $row['category_name'],
        "category_id" => $row['category_id'],
        "instructor" => $row['instructor_name'],
        "instructor_id" => $row['instructor_id'],
        "thumbnail" => $row['thumbnail'],
        "status" => $row['status'],
        "total_modules" => intval($row['total_modules']),
        "total_lessons" => intval($row['total_lessons']),
        "total_enrollments" => intval($row['total_enrollments']),
        "created_at" => $row['created_at']
    );
}

http_response_code(200);
echo json_encode($courses_arr);
?>