<?php
require_once __DIR__ . '/../backend/config/Database.php';

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    die("Database connection failed.\n");
}

echo "Updating database schema for comprehensive LMS enhancements...\n";

// 1. Add prerequisite_module_id to modules table
try {
    $db->exec("ALTER TABLE modules ADD COLUMN prerequisite_module_id INT DEFAULT NULL");
    $db->exec("ALTER TABLE modules ADD CONSTRAINT fk_modules_prerequisite FOREIGN KEY (prerequisite_module_id) REFERENCES modules(id) ON DELETE SET NULL");
    echo "- Added prerequisite_module_id to modules.\n";
} catch (Exception $e) {
    // Already exists or ignore
}

// 2. Add module_id and is_final to quizzes
try {
    $db->exec("ALTER TABLE quizzes ADD COLUMN module_id INT DEFAULT NULL");
    $db->exec("ALTER TABLE quizzes ADD COLUMN is_final BOOLEAN DEFAULT TRUE");
    echo "- Added module_id & is_final to quizzes.\n";
} catch (Exception $e) {}

// 3. Add submission_text to submissions
try {
    $db->exec("ALTER TABLE submissions ADD COLUMN submission_text LONGTEXT DEFAULT NULL");
    echo "- Added submission_text to submissions.\n";
} catch (Exception $e) {}

// 4. Create announcements table
$db->exec("CREATE TABLE IF NOT EXISTS announcements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT DEFAULT NULL,
    author_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    priority ENUM('normal', 'important', 'urgent') DEFAULT 'normal',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
)");
echo "- Created announcements table.\n";

// 5. Create course_resources table
$db->exec("CREATE TABLE IF NOT EXISTS course_resources (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    module_id INT DEFAULT NULL,
    title VARCHAR(150) NOT NULL,
    resource_type ENUM('pdf', 'code', 'link', 'video', 'document') DEFAULT 'pdf',
    resource_url VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
)");
echo "- Created course_resources table.\n";

// 6. Update Module Prerequisites in Course 1:
// Module 1: Web Architecture (no prereq)
// Module 2: CSS (prereq = Module 1)
// Module 3: JS (prereq = Module 2)
// Module 4: PHP (prereq = Module 3)
$c1Modules = $db->query("SELECT id, order_index FROM modules WHERE course_id = 1 ORDER BY order_index ASC")->fetchAll(PDO::FETCH_ASSOC);
if (count($c1Modules) >= 4) {
    $m1 = $c1Modules[0]['id'];
    $m2 = $c1Modules[1]['id'];
    $m3 = $c1Modules[2]['id'];
    $m4 = $c1Modules[3]['id'];

    $db->prepare("UPDATE modules SET prerequisite_module_id = NULL WHERE id = ?")->execute([$m1]);
    $db->prepare("UPDATE modules SET prerequisite_module_id = ? WHERE id = ?")->execute([$m1, $m2]);
    $db->prepare("UPDATE modules SET prerequisite_module_id = ? WHERE id = ?")->execute([$m2, $m3]);
    $db->prepare("UPDATE modules SET prerequisite_module_id = ? WHERE id = ?")->execute([$m3, $m4]);
    echo "- Set sequential prerequisite module locks for Course 1.\n";
}

// 7. Seed sample announcements
$adminId = $db->query("SELECT id FROM users WHERE role = 'admin' LIMIT 1")->fetchColumn() ?: 1;
$instId = $db->query("SELECT id FROM users WHERE role = 'instructor' LIMIT 1")->fetchColumn() ?: 2;

$annCount = $db->query("SELECT COUNT(*) FROM announcements")->fetchColumn();
if ($annCount == 0) {
    $insAnn = $db->prepare("INSERT INTO announcements (course_id, author_id, title, content, priority, created_at) VALUES (?, ?, ?, ?, ?, NOW())");
    $insAnn->execute([
        NULL,
        $adminId,
        'Welcome to Fall 2026 Academic Semester on LearnSphere!',
        'We are thrilled to welcome all engineering students to the enhanced LearnSphere LMS. Check out our new interactive coding labs, module locking system, downloadable cheat sheets, and digital certificate verification.',
        'important'
    ]);
    $insAnn->execute([
        1,
        $instId,
        'Module 4 PHP & MySQL Backend REST API Workshop Scheduled',
        'Dear students, please ensure you complete all interactive knowledge checks in Modules 1, 2, and 3 before unlocking Module 4. We will review PDO security and prepared statements during office hours.',
        'normal'
    ]);
    $insAnn->execute([
        1,
        $instId,
        'Final Capstone Assignment Released – Submission Guidelines',
        'The responsive full-stack dashboard assignment deadline is set for 30 days from now. Please review the rubric in the Gradebook and submit your repository link or source code.',
        'urgent'
    ]);
    echo "- Seeded announcements.\n";
}

// 8. Seed course resources
$resCount = $db->query("SELECT COUNT(*) FROM course_resources")->fetchColumn();
if ($resCount == 0) {
    $insRes = $db->prepare("INSERT INTO course_resources (course_id, title, resource_type, resource_url, description) VALUES (?, ?, ?, ?, ?)");
    $insRes->execute([
        1,
        'HTML5 & Modern Semantic Elements Cheatsheet (PDF)',
        'pdf',
        'https://developer.mozilla.org/en-US/docs/Glossary/Semantics',
        'Quick reference guide covering HTML5 semantic landmarks, accessibility attributes, and best practices.'
    ]);
    $insRes->execute([
        1,
        'CSS Flexbox & Grid Responsive Starter Kit (Code)',
        'code',
        'https://github.com/learnsphere/starter-templates',
        'Boilerplate starter project configured with mobile-first CSS Grid and Flexbox alignment utilities.'
    ]);
    $insRes->execute([
        1,
        'PHP 8 PDO Secure Database Connection Template',
        'code',
        'https://www.php.net/manual/en/book.pdo.php',
        'Production-grade PHP snippet demonstrating parameterized queries and error handling.'
    ]);
    $insRes->execute([
        2,
        'Python for Data Science Cheat Sheet: NumPy & Pandas',
        'pdf',
        'https://pandas.pydata.org/Pandas_Cheat_Sheet.pdf',
        'Comprehensive 2-page cheatsheet detailing vectorized mathematical operations and dataframe filtering.'
    ]);
    echo "- Seeded course resources.\n";
}

// 9. Ensure Assignments and Sample Submissions
$asCount = $db->query("SELECT COUNT(*) FROM assignments WHERE course_id = 1")->fetchColumn();
if ($asCount == 0) {
    $db->prepare("INSERT INTO assignments (course_id, title, description, deadline, max_marks, resource_url) VALUES 
        (1, 'Responsive Portfolio Design', 'Build a mobile-first personal portfolio website using semantic HTML5 and modern CSS3 Grid/Flexbox.', DATE_ADD(NOW(), INTERVAL 14 DAY), 100, 'https://github.com/learnsphere/portfolio-rubric'),
        (1, 'Full-Stack REST API & Database Integration', 'Implement a secure PHP 8 REST API with prepared PDO statements and connect it to a MySQL backend.', DATE_ADD(NOW(), INTERVAL 30 DAY), 100, 'https://github.com/learnsphere/api-spec')
    ")->execute();
    echo "- Created course assignments.\n";
}

// Ensure Student 3 has a graded assignment submission for Gradebook demo
$studentId = $db->query("SELECT id FROM users WHERE role = 'student' LIMIT 1")->fetchColumn() ?: 3;
$assignment1Id = $db->query("SELECT id FROM assignments WHERE course_id = 1 ORDER BY id ASC LIMIT 1")->fetchColumn();

if ($assignment1Id) {
    $subCount = $db->query("SELECT COUNT(*) FROM submissions WHERE assignment_id = $assignment1Id AND student_id = $studentId")->fetchColumn();
    if ($subCount == 0) {
        $insSub = $db->prepare("INSERT INTO submissions (assignment_id, student_id, file_url, submission_text, status, marks_obtained, feedback, submitted_at, graded_at) VALUES (?, ?, ?, ?, 'graded', 92, 'Outstanding implementation! The semantic HTML structure and CSS Flexbox alignment are exemplary. All responsive breakpoints work flawlessly on mobile and desktop.', DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY))");
        $insSub->execute([
            $assignment1Id,
            $studentId,
            'https://github.com/alex-rivera/responsive-portfolio-project',
            "Repository: https://github.com/alex-rivera/responsive-portfolio-project\nLive Demo: https://alex-rivera.github.io/portfolio\n\nFeatures implemented:\n1. Semantic HTML5 tags (<header>, <nav>, <main>, <section>, <footer>)\n2. Pure CSS Grid layout with minmax auto-fit\n3. Mobile responsive drawer navigation"
        ]);
        echo "- Seeded graded student assignment submission for Gradebook.\n";
    }
}

echo "Database enhancement complete!\n";
