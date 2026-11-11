<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

include_once '../../config/Database.php';

$database = new Database();
$db = $database->getConnection();

$total_users = intval($db->query("SELECT COUNT(*) FROM users")->fetchColumn());
$total_students = intval($db->query("SELECT COUNT(*) FROM users WHERE role = 'student'")->fetchColumn());
$total_instructors = intval($db->query("SELECT COUNT(*) FROM users WHERE role = 'instructor'")->fetchColumn());
$total_admins = intval($db->query("SELECT COUNT(*) FROM users WHERE role = 'admin'")->fetchColumn());

$total_courses = intval($db->query("SELECT COUNT(*) FROM courses")->fetchColumn());
$published_courses = intval($db->query("SELECT COUNT(*) FROM courses WHERE status = 'published'")->fetchColumn());
$total_modules = intval($db->query("SELECT COUNT(*) FROM modules")->fetchColumn());
$total_lessons = intval($db->query("SELECT COUNT(*) FROM lessons")->fetchColumn());

$total_enrollments = intval($db->query("SELECT COUNT(*) FROM enrollments")->fetchColumn());
$completed_courses = intval($db->query("SELECT COUNT(*) FROM enrollments WHERE progress_percentage >= 100")->fetchColumn());
$total_certificates = intval($db->query("SELECT COUNT(*) FROM certificates")->fetchColumn());

$total_quizzes = intval($db->query("SELECT COUNT(*) FROM quizzes")->fetchColumn());
$total_quiz_attempts = intval($db->query("SELECT COUNT(*) FROM quiz_attempts")->fetchColumn());
$total_assignments = intval($db->query("SELECT COUNT(*) FROM assignments")->fetchColumn());
$total_submissions = intval($db->query("SELECT COUNT(*) FROM submissions")->fetchColumn());
$total_announcements = intval($db->query("SELECT COUNT(*) FROM announcements")->fetchColumn());

// Recent registrations
$recent_users = $db->query("SELECT id, name, email, role, is_approved, created_at FROM users ORDER BY created_at DESC LIMIT 5")->fetchAll(PDO::FETCH_ASSOC);

// Recent courses
$recent_courses = $db->query("SELECT c.id, c.title, c.difficulty, c.status, c.created_at, u.name as instructor_name, cat.name as category_name,
                                     (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id) as enrollment_count
                              FROM courses c
                              LEFT JOIN users u ON c.instructor_id = u.id
                              LEFT JOIN categories cat ON c.category_id = cat.id
                              ORDER BY c.created_at DESC LIMIT 5")->fetchAll(PDO::FETCH_ASSOC);

http_response_code(200);
echo json_encode([
    "stats" => [
        "total_users" => $total_users,
        "total_students" => $total_students,
        "total_instructors" => $total_instructors,
        "total_admins" => $total_admins,
        "total_courses" => $total_courses,
        "published_courses" => $published_courses,
        "total_modules" => $total_modules,
        "total_lessons" => $total_lessons,
        "total_enrollments" => $total_enrollments,
        "completed_courses" => $completed_courses,
        "total_certificates" => $total_certificates,
        "total_quizzes" => $total_quizzes,
        "total_quiz_attempts" => $total_quiz_attempts,
        "total_assignments" => $total_assignments,
        "total_submissions" => $total_submissions,
        "total_announcements" => $total_announcements
    ],
    "recent_users" => $recent_users,
    "recent_courses" => $recent_courses
]);
?>