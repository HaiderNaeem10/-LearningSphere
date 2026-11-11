<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../../config/Database.php';

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    http_response_code(500);
    echo json_encode(["message" => "Database connection failure."]);
    exit;
}

$course_id = null;
$instructor_id = null;
$students_to_process = [];

// Handle Multipart/Form-Data (File Upload) OR JSON body
$contentType = isset($_SERVER["CONTENT_TYPE"]) ? $_SERVER["CONTENT_TYPE"] : '';

if (strpos($contentType, 'multipart/form-data') !== false) {
    $course_id = isset($_POST['course_id']) ? intval($_POST['course_id']) : null;
    $instructor_id = isset($_POST['instructor_id']) ? intval($_POST['instructor_id']) : null;

    if (isset($_FILES['file']) && $_FILES['file']['error'] == UPLOAD_ERR_OK) {
        $fileTmpPath = $_FILES['file']['tmp_name'];
        $fileName = $_FILES['file']['name'];
        $fileExtension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));

        // Read CSV / Text formatted file
        if (in_array($fileExtension, ['csv', 'txt', 'xls', 'xlsx'])) {
            if (($handle = fopen($fileTmpPath, "r")) !== FALSE) {
                // Read lines
                $isHeader = true;
                while (($row = fgetcsv($handle, 1000, ",")) !== FALSE) {
                    // If file is semicolon separated, try that
                    if (count($row) == 1 && strpos($row[0], ';') !== false) {
                        $row = explode(';', $row[0]);
                    }

                    if (empty($row) || empty(trim($row[0]))) continue;

                    // Skip header row if it contains 'name' or 'email'
                    $firstCol = strtolower(trim($row[0]));
                    if ($isHeader && ($firstCol === 'name' || $firstCol === 'email' || $firstCol === 'student name')) {
                        $isHeader = false;
                        continue;
                    }
                    $isHeader = false;

                    $name = '';
                    $email = '';
                    $rowCourse = '';

                    if (count($row) >= 3) {
                        $name = trim($row[0]);
                        $email = trim($row[1]);
                        $rowCourse = trim($row[2]);
                    } elseif (count($row) == 2) {
                        $name = trim($row[0]);
                        $email = trim($row[1]);
                    } else {
                        // Single column: could be email
                        $email = trim($row[0]);
                        $name = explode('@', $email)[0];
                    }

                    if (filter_var($email, FILTER_VALIDATE_EMAIL)) {
                        $students_to_process[] = [
                            'name' => htmlspecialchars(strip_tags($name ?: explode('@', $email)[0])),
                            'email' => htmlspecialchars(strip_tags($email)),
                            'course_ref' => htmlspecialchars(strip_tags($rowCourse))
                        ];
                    }
                }
                fclose($handle);
            }
        } else {
            http_response_code(400);
            echo json_encode(["message" => "Unsupported file type. Please upload a .csv or spreadsheet file."]);
            exit;
        }
    }
} else {
    // Process JSON input
    $data = json_decode(file_get_contents("php://input"));
    if ($data) {
        $course_id = isset($data->course_id) ? intval($data->course_id) : null;
        $instructor_id = isset($data->instructor_id) ? intval($data->instructor_id) : null;

        if (isset($data->students) && is_array($data->students)) {
            foreach ($data->students as $item) {
                $email = is_string($item) ? trim($item) : trim($item->email ?? '');
                $name = is_string($item) ? explode('@', $email)[0] : trim($item->name ?? explode('@', $email)[0]);
                $rowCourse = is_string($item) ? '' : trim($item->course ?? $item->course_ref ?? $item->course_title ?? '');

                if (filter_var($email, FILTER_VALIDATE_EMAIL)) {
                    $students_to_process[] = [
                        'name' => htmlspecialchars(strip_tags($name)),
                        'email' => htmlspecialchars(strip_tags($email)),
                        'course_ref' => htmlspecialchars(strip_tags($rowCourse))
                    ];
                }
            }
        }
    }
}

if (empty($students_to_process)) {
    http_response_code(400);
    echo json_encode(["message" => "No valid student entries found in upload. Please check the spreadsheet format."]);
    exit;
}

// Processing counters
$newly_created_accounts = 0;
$newly_enrolled = 0;
$already_enrolled = 0;
$failed_records = 0;
$processed_list = [];

$defaultPasswordHash = password_hash('Student@123', PASSWORD_BCRYPT);

// Pre-fetch courses for fast row matching
$allCoursesStmt = $db->query("SELECT id, title FROM courses");
$allCoursesList = $allCoursesStmt->fetchAll(PDO::FETCH_ASSOC);

foreach ($students_to_process as $s) {
    $email = $s['email'];
    $name = $s['name'];
    $courseRef = $s['course_ref'] ?? '';

    // Determine target course for this student
    $targetCourseId = $course_id;
    $targetCourseTitle = '';

    if (!empty($courseRef)) {
        // Try match by ID or title
        foreach ($allCoursesList as $cItem) {
            if (is_numeric($courseRef) && intval($courseRef) === intval($cItem['id'])) {
                $targetCourseId = $cItem['id'];
                $targetCourseTitle = $cItem['title'];
                break;
            } elseif (stripos($cItem['title'], $courseRef) !== false || stripos($courseRef, $cItem['title']) !== false) {
                $targetCourseId = $cItem['id'];
                $targetCourseTitle = $cItem['title'];
                break;
            }
        }
    }

    if (!$targetCourseId) {
        $failed_records++;
        $processed_list[] = [
            'name' => $name,
            'email' => $email,
            'course' => $courseRef ?: 'Unspecified',
            'status' => 'Failed: No matching course found'
        ];
        continue;
    }

    if (empty($targetCourseTitle)) {
        foreach ($allCoursesList as $cItem) {
            if (intval($cItem['id']) === intval($targetCourseId)) {
                $targetCourseTitle = $cItem['title'];
                break;
            }
        }
    }

    // 1. Check if user already exists
    $userStmt = $db->prepare("SELECT id, name FROM users WHERE email = ?");
    $userStmt->execute([$email]);
    $user = $userStmt->fetch(PDO::FETCH_ASSOC);

    $student_id = null;

    if ($user) {
        $student_id = $user['id'];
        $name = $user['name']; // Use existing name
    } else {
        // Create new student account automatically
        $insUser = $db->prepare("INSERT INTO users (name, email, password_hash, role, is_approved) VALUES (?, ?, ?, 'student', 1)");
        if ($insUser->execute([$name, $email, $defaultPasswordHash])) {
            $student_id = $db->lastInsertId();
            $newly_created_accounts++;
        } else {
            $failed_records++;
            continue;
        }
    }

    // 2. Check if already enrolled in this course
    $enCheck = $db->prepare("SELECT id, assigned_by FROM enrollments WHERE student_id = ? AND course_id = ?");
    $enCheck->execute([$student_id, $targetCourseId]);
    $existingEnrollment = $enCheck->fetch(PDO::FETCH_ASSOC);

    if ($existingEnrollment) {
        $already_enrolled++;
        // Update assigned_by if not set
        if (empty($existingEnrollment['assigned_by']) && $instructor_id) {
            $upd = $db->prepare("UPDATE enrollments SET assigned_by = ? WHERE id = ?");
            $upd->execute([$instructor_id, $existingEnrollment['id']]);
        }
        $processed_list[] = [
            'name' => $name,
            'email' => $email,
            'course' => $targetCourseTitle,
            'status' => 'Already Enrolled'
        ];
    } else {
        // Enroll student with instructor assignment
        $insEn = $db->prepare("INSERT INTO enrollments (student_id, course_id, assigned_by, progress_percentage, enrolled_at) VALUES (?, ?, ?, 0.00, NOW())");
        if ($insEn->execute([$student_id, $targetCourseId, $instructor_id])) {
            $newly_enrolled++;
            $processed_list[] = [
                'name' => $name,
                'email' => $email,
                'course' => $targetCourseTitle,
                'status' => 'Successfully Assigned & Enrolled'
            ];
        }
    }
}

http_response_code(200);
echo json_encode([
    "message" => "Automated spreadsheet processing completed.",
    "total_records" => count($students_to_process),
    "newly_created_accounts" => $newly_created_accounts,
    "newly_enrolled" => $newly_enrolled,
    "already_enrolled" => $already_enrolled,
    "failed_records" => $failed_records,
    "students" => $processed_list
]);
exit;
?>
