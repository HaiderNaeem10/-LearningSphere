<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

include_once '../../config/Database.php';

$database = new Database();
$db = $database->getConnection();

$quiz_id = isset($_GET['quiz_id']) ? intval($_GET['quiz_id']) : null;
$course_id = isset($_GET['course_id']) ? intval($_GET['course_id']) : null;
$module_id = isset($_GET['module_id']) ? intval($_GET['module_id']) : null;

if ($quiz_id) {
    $stmt = $db->prepare("SELECT q.id, q.course_id, q.title, q.passing_percentage, q.module_id, q.is_final, c.title as course_title
                          FROM quizzes q
                          JOIN courses c ON q.course_id = c.id
                          WHERE q.id = ? LIMIT 0,1");
    $stmt->execute([$quiz_id]);
} elseif ($course_id && $module_id) {
    $stmt = $db->prepare("SELECT q.id, q.course_id, q.title, q.passing_percentage, q.module_id, q.is_final, c.title as course_title
                          FROM quizzes q
                          JOIN courses c ON q.course_id = c.id
                          WHERE q.course_id = ? AND q.module_id = ? LIMIT 0,1");
    $stmt->execute([$course_id, $module_id]);
} elseif ($course_id) {
    // Return final quiz or first available quiz for this course
    $stmt = $db->prepare("SELECT q.id, q.course_id, q.title, q.passing_percentage, q.module_id, q.is_final, c.title as course_title
                          FROM quizzes q
                          JOIN courses c ON q.course_id = c.id
                          WHERE q.course_id = ?
                          ORDER BY q.is_final DESC, q.id ASC LIMIT 0,1");
    $stmt->execute([$course_id]);
} else {
    http_response_code(400);
    echo json_encode(["message" => "Quiz ID or Course ID is required."]);
    exit;
}

if ($stmt->rowCount() > 0) {
    $quiz_row = $stmt->fetch(PDO::FETCH_ASSOC);
    $quiz = array(
        "id" => intval($quiz_row['id']),
        "course_id" => intval($quiz_row['course_id']),
        "course_title" => $quiz_row['course_title'],
        "title" => $quiz_row['title'],
        "passing_percentage" => floatval($quiz_row['passing_percentage']),
        "module_id" => $quiz_row['module_id'] ? intval($quiz_row['module_id']) : null,
        "is_final" => (bool)$quiz_row['is_final'],
        "questions" => array()
    );

    $q_query = "SELECT id, question_text, marks, explanation FROM quiz_questions WHERE quiz_id = ? ORDER BY id ASC";
    $q_stmt = $db->prepare($q_query);
    $q_stmt->execute([$quiz['id']]);

    while ($q_row = $q_stmt->fetch(PDO::FETCH_ASSOC)) {
        $question = array(
            "id" => intval($q_row['id']),
            "text" => $q_row['question_text'],
            "marks" => intval($q_row['marks']),
            "explanation" => $q_row['explanation'],
            "options" => array()
        );

        $opt_query = "SELECT id, option_text FROM quiz_options WHERE question_id = ? ORDER BY id ASC";
        $opt_stmt = $db->prepare($opt_query);
        $opt_stmt->execute([$q_row['id']]);

        while ($opt_row = $opt_stmt->fetch(PDO::FETCH_ASSOC)) {
            array_push($question["options"], [
                "id" => intval($opt_row['id']),
                "option_text" => $opt_row['option_text']
            ]);
        }

        array_push($quiz["questions"], $question);
    }

    http_response_code(200);
    echo json_encode($quiz);
} else {
    http_response_code(404);
    echo json_encode(array("message" => "No quiz found."));
}
?>