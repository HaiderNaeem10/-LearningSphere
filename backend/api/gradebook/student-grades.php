<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

include_once '../../config/Database.php';

$database = new Database();
$db = $database->getConnection();

$student_id = isset($_GET['student_id']) ? intval($_GET['student_id']) : die();

// 1. Fetch student enrollments
$en_stmt = $db->prepare("SELECT e.id as enrollment_id, e.course_id, e.progress_percentage, e.enrolled_at, e.completed_at,
                                c.title as course_title, c.difficulty, cat.name as category_name,
                                u.name as instructor_name, cert.unique_code as certificate_code
                         FROM enrollments e
                         JOIN courses c ON e.course_id = c.id
                         LEFT JOIN categories cat ON c.category_id = cat.id
                         LEFT JOIN users u ON c.instructor_id = u.id
                         LEFT JOIN certificates cert ON (cert.student_id = e.student_id AND cert.course_id = c.id)
                         WHERE e.student_id = ?
                         ORDER BY e.enrolled_at DESC");
$en_stmt->execute([$student_id]);
$enrollments = $en_stmt->fetchAll(PDO::FETCH_ASSOC);

$course_records = [];
$total_quiz_percentage = 0;
$quiz_count = 0;
$total_assignment_percentage = 0;
$assignment_count = 0;
$total_modules_completed = 0;

foreach ($enrollments as $en) {
    $c_id = $en['course_id'];

    // Total modules and lessons in this course
    $mod_tot_stmt = $db->prepare("SELECT COUNT(*) FROM modules WHERE course_id = ?");
    $mod_tot_stmt->execute([$c_id]);
    $total_modules = intval($mod_tot_stmt->fetchColumn());

    $les_tot_stmt = $db->prepare("SELECT COUNT(*) FROM lessons WHERE module_id IN (SELECT id FROM modules WHERE course_id = ?)");
    $les_tot_stmt->execute([$c_id]);
    $total_lessons = intval($les_tot_stmt->fetchColumn());

    // Completed lessons
    $les_comp_stmt = $db->prepare("SELECT COUNT(*) FROM lesson_progress WHERE enrollment_id = ? AND is_completed = 1");
    $les_comp_stmt->execute([$en['enrollment_id']]);
    $completed_lessons = intval($les_comp_stmt->fetchColumn());

    // Quizzes & Attempts for this course
    $q_stmt = $db->prepare("SELECT q.id as quiz_id, q.title as quiz_title, q.passing_percentage,
                                   qa.score, qa.total_marks, qa.percentage, qa.is_passed, qa.attempted_at
                            FROM quizzes q
                            LEFT JOIN quiz_attempts qa ON (qa.quiz_id = q.id AND qa.student_id = ?)
                            WHERE q.course_id = ?
                            ORDER BY qa.attempted_at DESC");
    $q_stmt->execute([$student_id, $c_id]);
    $quizzes = $q_stmt->fetchAll(PDO::FETCH_ASSOC);

    // Assignments & Submissions for this course
    $as_stmt = $db->prepare("SELECT a.id as assignment_id, a.title as assignment_title, a.deadline, a.max_marks,
                                    s.id as submission_id, s.status, s.marks_obtained, s.feedback, s.submitted_at, s.graded_at
                             FROM assignments a
                             LEFT JOIN submissions s ON (s.assignment_id = a.id AND s.student_id = ?)
                             WHERE a.course_id = ?
                             ORDER BY a.deadline ASC");
    $as_stmt->execute([$student_id, $c_id]);
    $assignments = $as_stmt->fetchAll(PDO::FETCH_ASSOC);

    // Calculate course averages
    $course_quiz_scores = [];
    foreach ($quizzes as $q) {
        if ($q['score'] !== null && $q['total_marks'] > 0) {
            $course_quiz_scores[] = floatval($q['percentage']);
            $total_quiz_percentage += floatval($q['percentage']);
            $quiz_count++;
        }
    }

    $course_as_scores = [];
    foreach ($assignments as $a) {
        if ($a['status'] === 'graded' && $a['marks_obtained'] !== null && $a['max_marks'] > 0) {
            $pct = (floatval($a['marks_obtained']) / floatval($a['max_marks'])) * 100;
            $course_as_scores[] = $pct;
            $total_assignment_percentage += $pct;
            $assignment_count++;
        }
    }

    $avg_quiz = count($course_quiz_scores) > 0 ? round(array_sum($course_quiz_scores) / count($course_quiz_scores), 1) : null;
    $avg_as = count($course_as_scores) > 0 ? round(array_sum($course_as_scores) / count($course_as_scores), 1) : null;

    $overall_course_grade = null;
    if ($avg_quiz !== null && $avg_as !== null) {
        $overall_course_grade = round(($avg_quiz * 0.4) + ($avg_as * 0.6), 1);
    } elseif ($avg_quiz !== null) {
        $overall_course_grade = $avg_quiz;
    } elseif ($avg_as !== null) {
        $overall_course_grade = $avg_as;
    }

    $course_records[] = [
        "enrollment_id" => $en['enrollment_id'],
        "course_id" => $c_id,
        "course_title" => $en['course_title'],
        "difficulty" => $en['difficulty'],
        "category" => $en['category_name'],
        "instructor" => $en['instructor_name'],
        "progress_percentage" => floatval($en['progress_percentage']),
        "total_modules" => $total_modules,
        "total_lessons" => $total_lessons,
        "completed_lessons" => $completed_lessons,
        "certificate_code" => $en['certificate_code'],
        "quizzes" => $quizzes,
        "assignments" => $assignments,
        "avg_quiz_score" => $avg_quiz,
        "avg_assignment_score" => $avg_as,
        "overall_grade" => $overall_course_grade
    ];
}

// Summary statistics
$avg_quiz_global = $quiz_count > 0 ? round($total_quiz_percentage / $quiz_count, 1) : 0;
$avg_as_global = $assignment_count > 0 ? round($total_assignment_percentage / $assignment_count, 1) : 0;

$combined_grades = [];
foreach ($course_records as $cr) {
    if ($cr['overall_grade'] !== null) {
        $combined_grades[] = $cr['overall_grade'];
    }
}
$cumulative_gpa_pct = count($combined_grades) > 0 ? round(array_sum($combined_grades) / count($combined_grades), 1) : ($avg_quiz_global ?: 85.0);

http_response_code(200);
echo json_encode([
    "student_id" => $student_id,
    "summary" => [
        "total_enrolled" => count($enrollments),
        "completed_courses" => count(array_filter($enrollments, fn($e) => floatval($e['progress_percentage']) >= 100)),
        "in_progress_courses" => count(array_filter($enrollments, fn($e) => floatval($e['progress_percentage']) < 100)),
        "quizzes_taken" => $quiz_count,
        "avg_quiz_score" => $avg_quiz_global,
        "assignments_graded" => $assignment_count,
        "avg_assignment_score" => $avg_as_global,
        "cumulative_average" => $cumulative_gpa_pct,
        "certificates_earned" => count(array_filter($enrollments, fn($e) => !empty($e['certificate_code'])))
    ],
    "courses" => $course_records
]);
?>