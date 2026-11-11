<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

include_once '../../config/Database.php';

$database = new Database();
$db = $database->getConnection();

$id = isset($_GET['id']) ? intval($_GET['id']) : die();
$student_id = isset($_GET['student_id']) ? intval($_GET['student_id']) : null;

$query = "SELECT c.id, c.title, c.short_description, c.full_description, c.difficulty, c.thumbnail, cat.name as category_name, u.name as instructor_name, u.bio as instructor_bio 
          FROM courses c 
          LEFT JOIN categories cat ON c.category_id = cat.id 
          LEFT JOIN users u ON c.instructor_id = u.id
          WHERE c.id = ? LIMIT 0,1";

$stmt = $db->prepare($query);
$stmt->bindParam(1, $id);
$stmt->execute();

if($stmt->rowCount() > 0) {
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    $course = array(
        "id" => $row['id'],
        "title" => $row['title'],
        "short_description" => $row['short_description'],
        "full_description" => $row['full_description'],
        "difficulty" => $row['difficulty'],
        "category" => $row['category_name'],
        "instructor" => $row['instructor_name'],
        "instructor_bio" => $row['instructor_bio'],
        "thumbnail" => $row['thumbnail'],
        "is_enrolled" => false,
        "progress_percentage" => 0,
        "completed_lesson_ids" => [],
        "completed_module_ids" => [],
        "modules" => array(),
        "resources" => array(),
        "assignments" => array(),
        "announcements" => array(),
        "quizzes" => array()
    );

    // Check enrollment and progress if student_id is provided
    $completed_lesson_ids = [];
    if ($student_id) {
        $en_stmt = $db->prepare("SELECT id, progress_percentage FROM enrollments WHERE student_id = ? AND course_id = ?");
        $en_stmt->execute([$student_id, $id]);
        if ($en_row = $en_stmt->fetch(PDO::FETCH_ASSOC)) {
            $course["is_enrolled"] = true;
            $course["progress_percentage"] = floatval($en_row['progress_percentage']);
            $enrollment_id = $en_row['id'];

            // Fetch completed lessons
            $prog_stmt = $db->prepare("SELECT lesson_id FROM lesson_progress WHERE enrollment_id = ? AND is_completed = 1");
            $prog_stmt->execute([$enrollment_id]);
            $completed_lesson_ids = $prog_stmt->fetchAll(PDO::FETCH_COLUMN);
            $course["completed_lesson_ids"] = array_map('intval', $completed_lesson_ids);
        }
    }

    // Fetch modules and lessons
    $mod_query = "SELECT id, title, order_index, prerequisite_module_id FROM modules WHERE course_id = ? ORDER BY order_index ASC";
    $mod_stmt = $db->prepare($mod_query);
    $mod_stmt->bindParam(1, $id);
    $mod_stmt->execute();

    $modules_raw = $mod_stmt->fetchAll(PDO::FETCH_ASSOC);
    $completed_module_ids = [];

    // First pass: collect lessons and check completion per module
    $modules_processed = [];
    foreach ($modules_raw as $mod_row) {
        $m_id = intval($mod_row['id']);
        $module = array(
            "id" => $m_id,
            "title" => $mod_row['title'],
            "order_index" => intval($mod_row['order_index']),
            "prerequisite_module_id" => $mod_row['prerequisite_module_id'] ? intval($mod_row['prerequisite_module_id']) : null,
            "is_completed" => false,
            "is_locked" => false,
            "prerequisite_title" => null,
            "lessons" => array()
        );

        $les_query = "SELECT id, title, description, duration, video_url, text_content, resource_url, order_index FROM lessons WHERE module_id = ? ORDER BY order_index ASC";
        $les_stmt = $db->prepare($les_query);
        $les_stmt->bindParam(1, $m_id);
        $les_stmt->execute();

        $all_lessons_completed = true;
        $lessons_count = 0;

        while ($les_row = $les_stmt->fetch(PDO::FETCH_ASSOC)){
            $lessons_count++;
            $les_id = intval($les_row['id']);
            $is_comp = in_array($les_id, $course["completed_lesson_ids"]);
            if (!$is_comp) {
                $all_lessons_completed = false;
            }
            $les_row["is_completed"] = $is_comp;
            array_push($module["lessons"], $les_row);
        }

        if ($lessons_count > 0 && $all_lessons_completed) {
            $module["is_completed"] = true;
            $completed_module_ids[] = $m_id;
        }

        $modules_processed[$m_id] = $module;
    }

    // Map module titles for prerequisite display
    $module_titles = [];
    foreach ($modules_processed as $m_id => $m) {
        $module_titles[$m_id] = $m['title'];
    }

    // Second pass: compute locking based on prerequisite_module_id
    foreach ($modules_processed as $m_id => &$m) {
        if ($m['prerequisite_module_id']) {
            $prereq_id = $m['prerequisite_module_id'];
            $m['prerequisite_title'] = isset($module_titles[$prereq_id]) ? $module_titles[$prereq_id] : "Module $prereq_id";
            
            // Locked if student is enrolled and prerequisite module is not completed
            if ($course["is_enrolled"] && !in_array($prereq_id, $completed_module_ids)) {
                $m['is_locked'] = true;
            }
        }
        array_push($course["modules"], $m);
    }

    $course["completed_module_ids"] = $completed_module_ids;

    // Fetch course resources
    $res_stmt = $db->prepare("SELECT id, title, resource_type, resource_url, description, created_at FROM course_resources WHERE course_id = ? ORDER BY id ASC");
    $res_stmt->execute([$id]);
    $course["resources"] = $res_stmt->fetchAll(PDO::FETCH_ASSOC);

    // Fetch assignments (with submission status if student logged in)
    $as_stmt = $db->prepare("SELECT a.id, a.title, a.description, a.deadline, a.max_marks, a.resource_url, a.created_at,
                                    s.id as submission_id, s.status as submission_status, s.marks_obtained, s.feedback, s.submitted_at
                             FROM assignments a
                             LEFT JOIN submissions s ON (s.assignment_id = a.id AND s.student_id = ?)
                             WHERE a.course_id = ?
                             ORDER BY a.deadline ASC");
    $as_stmt->execute([$student_id ?: 0, $id]);
    $course["assignments"] = $as_stmt->fetchAll(PDO::FETCH_ASSOC);

    // Fetch announcements
    $ann_stmt = $db->prepare("SELECT a.id, a.title, a.content, a.priority, a.created_at, u.name as author_name, u.role as author_role
                              FROM announcements a
                              JOIN users u ON a.author_id = u.id
                              WHERE a.course_id = ? OR a.course_id IS NULL
                              ORDER BY a.created_at DESC");
    $ann_stmt->execute([$id]);
    $course["announcements"] = $ann_stmt->fetchAll(PDO::FETCH_ASSOC);

    // Fetch quizzes
    $quiz_stmt = $db->prepare("SELECT id, title, passing_percentage, module_id, is_final FROM quizzes WHERE course_id = ?");
    $quiz_stmt->execute([$id]);
    $course["quizzes"] = $quiz_stmt->fetchAll(PDO::FETCH_ASSOC);

    http_response_code(200);
    echo json_encode($course);
} else {
    http_response_code(404);
    echo json_encode(array("message" => "Course not found."));
}
?>