<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../../config/Database.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if(!empty($data->quiz_id) && !empty($data->student_id) && isset($data->answers)) {
    
    $total_marks = 0;
    $score = 0;
    $review = [];

    // Fetch quiz info
    $quizStmt = $db->prepare("SELECT id, course_id, title, passing_percentage FROM quizzes WHERE id = ?");
    $quizStmt->execute([$data->quiz_id]);
    $quiz = $quizStmt->fetch(PDO::FETCH_ASSOC);

    if (!$quiz) {
        http_response_code(404);
        echo json_encode(["message" => "Quiz not found."]);
        exit;
    }

    // Convert answers to lookup map
    $userAnswers = [];
    foreach ($data->answers as $ans) {
        $userAnswers[$ans->question_id] = $ans->option_id;
    }

    // Query all questions for this quiz
    $qQuery = "SELECT id, question_text, marks, explanation FROM quiz_questions WHERE quiz_id = ?";
    $qStmt = $db->prepare($qQuery);
    $qStmt->execute([$data->quiz_id]);
    $questions = $qStmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($questions as $q) {
        $q_id = $q['id'];
        $q_marks = intval($q['marks']);
        $total_marks += $q_marks;

        $chosen_opt_id = isset($userAnswers[$q_id]) ? intval($userAnswers[$q_id]) : null;

        // Fetch options for this question
        $optStmt = $db->prepare("SELECT id, option_text, is_correct FROM quiz_options WHERE question_id = ?");
        $optStmt->execute([$q_id]);
        $options = $optStmt->fetchAll(PDO::FETCH_ASSOC);

        $correct_opt_id = null;
        $is_question_correct = false;

        foreach ($options as $opt) {
            if ($opt['is_correct']) {
                $correct_opt_id = intval($opt['id']);
            }
            if ($chosen_opt_id === intval($opt['id']) && $opt['is_correct']) {
                $is_question_correct = true;
            }
        }

        if ($is_question_correct) {
            $score += $q_marks;
        }

        $review[] = [
            "question_id" => $q_id,
            "question_text" => $q['question_text'],
            "marks" => $q_marks,
            "explanation" => $q['explanation'],
            "selected_option_id" => $chosen_opt_id,
            "correct_option_id" => $correct_opt_id,
            "is_correct" => $is_question_correct,
            "options" => $options
        ];
    }

    $percentage = ($total_marks > 0) ? ($score / $total_marks) * 100 : 0;
    $is_passed = ($percentage >= floatval($quiz['passing_percentage'])) ? 1 : 0;

    // Record quiz attempt
    $query = "INSERT INTO quiz_attempts (student_id, quiz_id, score, total_marks, percentage, is_passed) VALUES (?, ?, ?, ?, ?, ?)";
    $stmt = $db->prepare($query);
    $stmt->execute([$data->student_id, $data->quiz_id, $score, $total_marks, $percentage, $is_passed]);

    // Check certificate eligibility
    $certificate_code = null;
    if ($is_passed) {
        $course_id = $quiz['course_id'];
        // Check if student is enrolled
        $enStmt = $db->prepare("SELECT id FROM enrollments WHERE student_id = ? AND course_id = ?");
        $enStmt->execute([$data->student_id, $course_id]);
        if ($enRow = $enStmt->fetch(PDO::FETCH_ASSOC)) {
            // Update enrollment progress and completed_at
            $upEn = $db->prepare("UPDATE enrollments SET progress_percentage = 100.00, completed_at = NOW() WHERE id = ?");
            $upEn->execute([$enRow['id']]);

            // Check if certificate already exists
            $certCheck = $db->prepare("SELECT unique_code FROM certificates WHERE student_id = ? AND course_id = ?");
            $certCheck->execute([$data->student_id, $course_id]);
            if ($certRow = $certCheck->fetch(PDO::FETCH_ASSOC)) {
                $certificate_code = $certRow['unique_code'];
            } else {
                $uniqueCode = 'LS-' . strtoupper(bin2hex(random_bytes(5)));
                $insCert = $db->prepare("INSERT INTO certificates (student_id, course_id, unique_code, issued_at) VALUES (?, ?, ?, NOW())");
                $insCert->execute([$data->student_id, $course_id, $uniqueCode]);
                $certificate_code = $uniqueCode;
            }
        }
    }

    http_response_code(200);
    echo json_encode([
        "message" => "Quiz evaluation completed.",
        "score" => $score,
        "total_marks" => $total_marks,
        "percentage" => round($percentage, 2),
        "passing_percentage" => floatval($quiz['passing_percentage']),
        "is_passed" => (bool)$is_passed,
        "certificate_code" => $certificate_code,
        "review" => $review
    ]);

} else {
    http_response_code(400);
    echo json_encode(["message" => "Incomplete data."]);
}
?>
