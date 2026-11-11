<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../../config/Database.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->course_id) && !empty($data->title) && !empty($data->questions)) {
    $course_id = intval($data->course_id);
    $module_id = !empty($data->module_id) ? intval($data->module_id) : null;
    $title = htmlspecialchars(strip_tags($data->title));
    $passing_percentage = !empty($data->passing_percentage) ? floatval($data->passing_percentage) : 70.0;
    $is_final = isset($data->is_final) ? (bool)$data->is_final : ($module_id ? false : true);

    $stmt = $db->prepare("INSERT INTO quizzes (course_id, module_id, title, passing_percentage, is_final, created_at) VALUES (?, ?, ?, ?, ?, NOW())");
    if ($stmt->execute([$course_id, $module_id, $title, $passing_percentage, $is_final ? 1 : 0])) {
        $quiz_id = $db->lastInsertId();

        foreach ($data->questions as $q) {
            $q_text = htmlspecialchars(strip_tags($q->question_text ?? ''));
            $marks = !empty($q->marks) ? intval($q->marks) : 10;
            $explanation = !empty($q->explanation) ? htmlspecialchars(strip_tags($q->explanation)) : null;

            if (empty($q_text)) continue;

            $insQ = $db->prepare("INSERT INTO quiz_questions (quiz_id, question_text, marks, explanation, created_at) VALUES (?, ?, ?, ?, NOW())");
            $insQ->execute([$quiz_id, $q_text, $marks, $explanation]);
            $question_id = $db->lastInsertId();

            if (!empty($q->options) && is_array($q->options)) {
                foreach ($q->options as $opt) {
                    $opt_text = htmlspecialchars(strip_tags($opt->option_text ?? ''));
                    $is_correct = !empty($opt->is_correct) ? 1 : 0;
                    if (empty($opt_text)) continue;

                    $insOpt = $db->prepare("INSERT INTO quiz_options (question_id, option_text, is_correct) VALUES (?, ?, ?)");
                    $insOpt->execute([$question_id, $opt_text, $is_correct]);
                }
            }
        }

        http_response_code(201);
        echo json_encode(["message" => "Quiz and questions created successfully.", "quiz_id" => $quiz_id]);
    } else {
        http_response_code(500);
        echo json_encode(["message" => "Failed to create quiz."]);
    }
} else {
    http_response_code(400);
    echo json_encode(["message" => "Course, title, and at least one question required."]);
}
?>