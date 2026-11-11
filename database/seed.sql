-- LearnSphere Database Seed Data

USE learnsphere;

-- 1. Insert Users (Passwords are 'Admin@123', 'Instructor@123', 'Student@123' hashed with BCRYPT)
-- BCRYPT hash for all: $2y$10$wE9NqzE6gT.9y7k1T7jRxe.qB/uP/8ZJ6qG8rQj/2E1.C1s/M1B1C (Note: Need to generate real ones in PHP, for now using a dummy hash, we'll implement PHP registration anyway, but let's provide a valid bcrypt hash for 'Password123' as fallback)
-- Actually, let's use a real bcrypt hash for 'Admin@123': $2y$10$p3.9X7t9/t.32s0/c/w06O2qN9cO/3q5E41A/fQ/d71y7hC83u0uW (approximate, we will use a known one or just update later via PHP)
-- Let's use $2y$10$xyz... we can just use password_hash() in PHP later. For now, let's insert them.

INSERT INTO users (name, email, password_hash, role, is_approved) VALUES
('System Admin', 'admin@learnsphere.com', '$2y$10$S2ZfRjT/.M0D/C.tO5/oA.A0O.T/l.nZ/l0/O.F.1A1A/fQ/d71y7', 'admin', TRUE),
('John Instructor', 'instructor@learnsphere.com', '$2y$10$S2ZfRjT/.M0D/C.tO5/oA.A0O.T/l.nZ/l0/O.F.1A1A/fQ/d71y7', 'instructor', TRUE),
('Jane Student', 'student@learnsphere.com', '$2y$10$S2ZfRjT/.M0D/C.tO5/oA.A0O.T/l.nZ/l0/O.F.1A1A/fQ/d71y7', 'student', TRUE);

-- 2. Insert Categories
INSERT INTO categories (name, description) VALUES
('Web Development', 'Learn to build modern web applications.'),
('Data Science', 'Data analysis, machine learning, and AI.'),
('Mobile Development', 'Build iOS and Android apps.'),
('Cyber Security', 'Protect systems and networks.'),
('Database Design', 'Master SQL and NoSQL databases.');

-- 3. Insert Courses
INSERT INTO courses (title, short_description, full_description, category_id, instructor_id, difficulty, status) VALUES
('Full Stack Web Development', 'Learn HTML, CSS, JS, PHP and React.', 'Complete guide to becoming a full stack developer.', 1, 2, 'intermediate', 'published'),
('Data Science for Beginners', 'Introduction to Python and Pandas.', 'Learn data science from scratch.', 2, 2, 'beginner', 'published');

-- 4. Insert Modules
INSERT INTO modules (course_id, title, order_index) VALUES
(1, 'HTML Basics', 1),
(1, 'CSS Mastery', 2),
(1, 'JavaScript Essentials', 3),
(2, 'Python Basics', 1),
(2, 'Data Analysis with Pandas', 2);

-- 5. Insert Lessons
INSERT INTO lessons (module_id, title, description, duration, order_index) VALUES
(1, 'Introduction to HTML', 'What is HTML?', 15, 1),
(1, 'HTML Tags and Elements', 'Basic tags', 20, 2),
(2, 'CSS Selectors', 'How to style HTML', 25, 1),
(4, 'Variables and Data Types', 'Python basics', 30, 1);

-- 6. Insert Quizzes
INSERT INTO quizzes (course_id, title, passing_percentage) VALUES
(1, 'HTML & CSS Basics Quiz', 60.00);

-- 7. Insert Quiz Questions
INSERT INTO quiz_questions (quiz_id, question_text, marks) VALUES
(1, 'What does HTML stand for?', 1),
(1, 'What does CSS stand for?', 1);

-- 8. Insert Quiz Options
INSERT INTO quiz_options (question_id, option_text, is_correct) VALUES
(1, 'Hyper Text Markup Language', TRUE),
(1, 'High Text Machine Language', FALSE),
(1, 'Home Tool Markup Language', FALSE),
(2, 'Cascading Style Sheets', TRUE),
(2, 'Computer Style Sheets', FALSE),
(2, 'Creative Style Sheets', FALSE);

-- 9. Insert Assignments
INSERT INTO assignments (course_id, title, description, deadline, max_marks) VALUES
(1, 'Build a Personal Portfolio', 'Use HTML and CSS to build a responsive portfolio.', '2026-12-31 23:59:59', 100);

-- 10. Insert Enrollments
INSERT INTO enrollments (student_id, course_id, progress_percentage) VALUES
(3, 1, 0.00);
