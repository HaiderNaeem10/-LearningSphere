<?php
require_once __DIR__ . '/../backend/config/Database.php';

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    die("Database connection failed.\n");
}

echo "Updating database schema & populating Coursera-style content...\n";

// 1. Add explanation column to quiz_questions if not exists
try {
    $db->exec("ALTER TABLE quiz_questions ADD COLUMN explanation TEXT DEFAULT NULL");
    echo "- Added explanation column to quiz_questions.\n";
} catch (Exception $e) {
    // Column already exists, ignore
}

// 2. Hash passwords
$adminPassword = password_hash('Admin@123', PASSWORD_BCRYPT);
$instructorPassword = password_hash('Instructor@123', PASSWORD_BCRYPT);
$studentPassword = password_hash('Student@123', PASSWORD_BCRYPT);

// 3. Update or Insert Users
$users = [
    ['System Administrator', 'admin@learnsphere.com', $adminPassword, 'admin', 'Lead platform administrator and curriculum reviewer.'],
    ['Dr. Sarah Jenkins', 'instructor@learnsphere.com', $instructorPassword, 'instructor', 'Senior Full-Stack Engineer and University Professor with 12+ years of industry experience.'],
    ['Alex Rivera', 'student@learnsphere.com', $studentPassword, 'student', 'Passionate software engineering undergraduate eager to master modern web technologies.']
];

foreach ($users as $u) {
    $stmt = $db->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$u[1]]);
    if ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $up = $db->prepare("UPDATE users SET name=?, password_hash=?, role=?, bio=?, is_approved=1 WHERE id=?");
        $up->execute([$u[0], $u[2], $u[3], $u[4], $row['id']]);
    } else {
        $ins = $db->prepare("INSERT INTO users (name, email, password_hash, role, bio, is_approved) VALUES (?, ?, ?, ?, ?, 1)");
        $ins->execute([$u[0], $u[1], $u[2], $u[3], $u[4]]);
    }
}
echo "- Users updated.\n";

// 4. Ensure Categories
$categories = [
    ['Web Development', 'Master frontend and backend web development using modern frameworks, responsive design, and REST APIs.'],
    ['Data Science & AI', 'Explore data analysis, machine learning algorithms, deep learning, and Python scientific libraries.'],
    ['Software Engineering', 'Learn clean architecture, design patterns, software testing, and production deployment.'],
    ['Database Systems', 'Design relational schemas, optimize complex SQL queries, and manage enterprise databases.']
];

foreach ($categories as $cat) {
    $stmt = $db->prepare("SELECT id FROM categories WHERE name = ?");
    $stmt->execute([$cat[0]]);
    if ($stmt->rowCount() == 0) {
        $ins = $db->prepare("INSERT INTO categories (name, description) VALUES (?, ?)");
        $ins->execute([$cat[0], $cat[1]]);
    }
}
echo "- Categories updated.\n";

// Clear out old demo course data cleanly to avoid duplicate clutter
$db->exec("SET FOREIGN_KEY_CHECKS = 0");
$db->exec("TRUNCATE TABLE lesson_progress");
$db->exec("TRUNCATE TABLE quiz_attempts");
$db->exec("TRUNCATE TABLE quiz_options");
$db->exec("TRUNCATE TABLE quiz_questions");
$db->exec("TRUNCATE TABLE quizzes");
$db->exec("TRUNCATE TABLE submissions");
$db->exec("TRUNCATE TABLE assignments");
$db->exec("TRUNCATE TABLE certificates");
$db->exec("TRUNCATE TABLE lessons");
$db->exec("TRUNCATE TABLE modules");
$db->exec("TRUNCATE TABLE enrollments");
$db->exec("TRUNCATE TABLE courses");
$db->exec("SET FOREIGN_KEY_CHECKS = 1");

echo "- Cleaned up old demo data.\n";

// Get Instructor ID
$stmt = $db->prepare("SELECT id FROM users WHERE email = 'instructor@learnsphere.com'");
$stmt->execute();
$instructorId = $stmt->fetchColumn() ?: 2;

// Get Category IDs
$webCat = $db->query("SELECT id FROM categories WHERE name = 'Web Development'")->fetchColumn() ?: 1;
$dsCat = $db->query("SELECT id FROM categories WHERE name = 'Data Science & AI'")->fetchColumn() ?: 2;
$seCat = $db->query("SELECT id FROM categories WHERE name = 'Software Engineering'")->fetchColumn() ?: 3;
$dbCat = $db->query("SELECT id FROM categories WHERE name = 'Database Systems'")->fetchColumn() ?: 4;

// ==========================================
// COURSE 1: FULL STACK WEB DEVELOPMENT
// ==========================================
$c1Sql = "INSERT INTO courses (title, short_description, full_description, category_id, instructor_id, difficulty, status) VALUES (
    'Full Stack Web Development: Modern Web Engineering',
    'A comprehensive, project-driven course covering HTML5, CSS3 Grid/Flexbox, ES6+ JavaScript, PHP REST APIs, and React.',
    'Welcome to the premier full-stack web development specialization on LearnSphere! Designed like top Coursera curriculum, this course takes you step-by-step from core web architecture to building production-ready, database-backed web applications. 

You will master:
1. Modern HTML5 semantic elements and accessibility (WCAG).
2. Advanced CSS3, Flexbox, CSS Grid, and responsive UI engineering.
3. JavaScript fundamentals, closures, async/await, and DOM manipulation.
4. Robust backend RESTful APIs using PHP 8 and MySQL with prepared statements.
5. Interactive frontend applications with React and state management.

Every module contains hands-on lecture notes, embedded visual walkthroughs, interactive quizzes with instant explanations, and practical assignments.',
    ?, ?, 'intermediate', 'published'
)";
$stmt = $db->prepare($c1Sql);
$stmt->execute([$webCat, $instructorId]);
$c1Id = $db->lastInsertId();

// Modules for Course 1
$c1Modules = [
    [
        'title' => 'Module 1: Web Architecture & Semantic HTML5',
        'lessons' => [
            [
                'title' => '1.1 How the Web Works: HTTP, DNS, and Browsers',
                'desc' => 'Understand the client-server model, request-response cycle, status codes, and browser rendering engines.',
                'video' => 'https://www.youtube.com/embed/7_LPdttKXPc',
                'duration' => 18,
                'content' => "### Lecture Summary: How the Web Works

When a user enters a URL into their browser, a multi-step sequence occurs:

1. **DNS Resolution:** The browser queries DNS servers to translate a human-readable domain name (e.g. `learnsphere.com`) into an IP address.
2. **TCP/IP Handshake & TLS:** A secure connection is established using TCP three-way handshake and SSL/TLS certificates (HTTPS).
3. **HTTP Request/Response:** The client issues an HTTP GET/POST request containing headers and body. The web server returns a response code (200 OK, 404 Not Found, 500 Server Error).
4. **Critical Rendering Path:** The browser parses HTML to construct the DOM tree, CSS to build the CSSOM tree, combines them into the Render Tree, and finally performs layout and painting on the screen."
            ],
            [
                'title' => '1.2 Modern Semantic HTML5 & Accessibility Standards',
                'desc' => 'Learn semantic tags (<main>, <article>, <section>, <nav>) and accessibility best practices.',
                'video' => 'https://www.youtube.com/embed/kUMe1FH4CHE',
                'duration' => 22,
                'content' => "### Semantic HTML5 Best Practices

Semantic HTML tags give meaning to the structure rather than just visual presentation:

- `<header>`: Introduces navigational links, branding, or page banners.
- `<nav>`: Encapsulates main navigation blocks.
- `<main>`: Represents the dominant, unique content of the `<body>`. Only one `<main>` tag should appear per page.
- `<section>` & `<article>`: `<article>` is self-contained and distributable (like a blog post or course card), whereas `<section>` groups thematic content.
- `aria-*` attributes: Provide assistive technology context for screen readers."
            ],
            [
                'title' => '1.3 Form Controls, Validation & Media Elements',
                'desc' => 'Master client-side validation, file inputs, custom form controls, and embedded audio/video tags.',
                'video' => 'https://www.youtube.com/embed/bWPMSSsVdPk',
                'duration' => 20,
                'content' => "### Form Validation & Controls

HTML5 provides native validation mechanisms:

```html
<form action=\"/submit\" method=\"POST\">
  <label for=\"email\">Email Address:</label>
  <input type=\"email\" id=\"email\" name=\"email\" required placeholder=\"user@domain.com\">
  
  <label for=\"password\">Password (min 8 chars):</label>
  <input type=\"password\" id=\"password\" minlength=\"8\" required>
  
  <button type=\"submit\" class=\"btn btn-primary\">Submit</button>
</form>
```

Always remember: Client-side validation improves user experience, but **never trust client input**; server-side validation is strictly mandatory for security."
            ]
        ]
    ],
    [
        'title' => 'Module 2: Advanced CSS3, Flexbox & Responsive Layouts',
        'lessons' => [
            [
                'title' => '2.1 CSS Box Model, Specificity & Custom Properties',
                'desc' => 'Deep dive into margin collapse, box-sizing: border-box, CSS variables, and specificity hierarchies.',
                'video' => 'https://www.youtube.com/embed/rIO5326FgPE',
                'duration' => 25,
                'content' => "### The CSS Box Model

Every element in a document is rendered as a rectangular box comprising four concentric layers:
1. **Content:** Where text and images reside.
2. **Padding:** Transparent spacing clearing area around the content.
3. **Border:** Border that wraps padding and content.
4. **Margin:** Spacing outside the border separating neighboring elements.

Always use:
```css
* {
  box-sizing: border-box;
}
```
This ensures `padding` and `border` are included in the element's specified width and height, preventing unexpected horizontal scrolling."
            ],
            [
                'title' => '2.2 Flexbox: 1-Dimensional Dynamic Alignment',
                'desc' => 'Master justify-content, align-items, flex-grow, flex-shrink, and wrap behaviors for responsive navbars and cards.',
                'video' => 'https://www.youtube.com/embed/fYq5PXgSsbE',
                'duration' => 28,
                'content' => "### CSS Flexbox Guide

Flexbox provides one-dimensional layout control along the **main axis** and **cross axis**:

- `display: flex;`: Turns the container into a flex context.
- `justify-content`: Controls distribution along the main axis (`flex-start`, `center`, `space-between`, `space-around`, `space-evenly`).
- `align-items`: Controls alignment along the cross axis (`stretch`, `center`, `flex-start`, `flex-end`).
- `flex: 1 1 auto;`: Shorthand for `flex-grow`, `flex-shrink`, and `flex-basis`."
            ],
            [
                'title' => '2.3 CSS Grid: 2-Dimensional Layout Engineering',
                'desc' => 'Construct responsive multi-column layouts using grid-template-columns, repeat(auto-fit, minmax()), and grid-gap.',
                'video' => 'https://www.youtube.com/embed/jV8B24rSN5o',
                'duration' => 30,
                'content' => "### CSS Grid Layout

Grid enables simultaneous two-dimensional alignment (rows and columns):

```css
.course-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}
```

This single declaration creates an intrinsically responsive grid that automatically reorganizes columns without needing tedious media queries."
            ]
        ]
    ],
    [
        'title' => 'Module 3: JavaScript ES6+ & Asynchronous Programming',
        'lessons' => [
            [
                'title' => '3.1 Modern ES6+ Syntax, Scoping & Destructuring',
                'desc' => 'Master let/const, arrow functions, object/array destructuring, rest/spread operators, and template literals.',
                'video' => 'https://www.youtube.com/embed/NCwa_xi0Uuc',
                'duration' => 32,
                'content' => "### ES6+ Core Features

Modern JavaScript emphasizes immutability, readability, and functional paradigms:

```javascript
// Destructuring & Default Values
const user = { id: 101, name: 'Alex', role: 'student' };
const { name, role, email = 'unregistered@learnsphere.com' } = user;

// Spread Operator for immutability
const updatedUser = { ...user, isEnrolled: true };
```"
            ],
            [
                'title' => '3.2 Asynchronous JavaScript: Promises & Async/Await',
                'desc' => 'Understand the Event Loop, microtask queue, Promise lifecycle, and modern async/await error handling.',
                'video' => 'https://www.youtube.com/embed/PoRJizFvM7s',
                'duration' => 35,
                'content' => "### Asynchronous Flow Control

JavaScript is single-threaded with an event-driven concurrency model powered by the Event Loop:

```javascript
async function fetchCourseData(courseId) {
  try {
    const response = await fetch(`/api/courses/details.php?id=\${courseId}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: \${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Fetch operation failed:', error.message);
    throw error;
  }
}
```"
            ]
        ]
    ],
    [
        'title' => 'Module 4: Backend RESTful APIs with PHP 8 & MySQL',
        'lessons' => [
            [
                'title' => '4.1 Designing Clean RESTful Endpoints',
                'desc' => 'HTTP verbs (GET, POST, PUT, DELETE), JSON request/response standards, headers, and CORS configuration.',
                'video' => 'https://www.youtube.com/embed/72kgR_WjGcA',
                'duration' => 26,
                'content' => "### REST API Principles

A RESTful service communicates over standard HTTP protocols:
- `GET`: Retrieve existing resource. Idempotent and safe.
- `POST`: Create a new resource. Non-idempotent.
- `PUT`: Update/replace an existing resource entirely.
- `DELETE`: Remove a resource.

Always return standard HTTP status codes:
- `200 OK`: Request succeeded.
- `201 Created`: Resource successfully created.
- `400 Bad Request`: Validation failure.
- `401 Unauthorized`: Missing or invalid credentials.
- `404 Not Found`: Target resource does not exist."
            ],
            [
                'title' => '4.2 Database Security: PDO Prepared Statements & Hashing',
                'desc' => 'Prevent SQL Injection using PDO parameterized queries, and secure passwords with bcrypt algorithm.',
                'video' => 'https://www.youtube.com/embed/2HVKizgcfH8',
                'duration' => 30,
                'content' => "### Preventing SQL Injection with PDO

Never concatenate raw user strings into SQL queries:

```php
// SECURE: Parameterized Query
\$stmt = \$pdo->prepare('SELECT id, name, password_hash FROM users WHERE email = :email');
\$stmt->execute([':email' => \$inputEmail]);
\$user = \$stmt->fetch(PDO::FETCH_ASSOC);

if (\$user && password_verify(\$inputPassword, \$user['password_hash'])) {
    // Authenticated successfully
}
```"
            ]
        ]
    ]
];

foreach ($c1Modules as $mIdx => $m) {
    $insM = $db->prepare("INSERT INTO modules (course_id, title, order_index) VALUES (?, ?, ?)");
    $insM->execute([$c1Id, $m['title'], $mIdx + 1]);
    $mId = $db->lastInsertId();

    foreach ($m['lessons'] as $lIdx => $l) {
        $insL = $db->prepare("INSERT INTO lessons (module_id, title, description, video_url, duration, text_content, order_index) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $insL->execute([$mId, $l['title'], $l['desc'], $l['video'], $l['duration'], $l['content'], $lIdx + 1]);
    }
}
echo "- Course 1 modules and lessons created.\n";

// Comprehensive 10-Question Quiz for Course 1
$q1Sql = "INSERT INTO quizzes (course_id, title, passing_percentage) VALUES (?, 'Full Stack Web Development Certification Assessment', 70.00)";
$stmt = $db->prepare($q1Sql);
$stmt->execute([$c1Id]);
$quiz1Id = $db->lastInsertId();

$quiz1Questions = [
    [
        'q' => 'Which HTTP status code is most appropriate when a new resource is successfully created via a POST request?',
        'marks' => 10,
        'explanation' => 'HTTP 201 Created indicates that the request has succeeded and led to the creation of a new resource on the server.',
        'options' => [
            ['200 OK', false],
            ['201 Created', true],
            ['204 No Content', false],
            ['202 Accepted', false]
        ]
    ],
    [
        'q' => 'In CSS, what is the primary difference between setting "box-sizing: content-box" versus "box-sizing: border-box"?',
        'marks' => 10,
        'explanation' => 'With border-box, the width and height properties include the content, padding, and borders. In content-box, padding and borders are added on top of width and height.',
        'options' => [
            ['border-box includes padding and border within the specified element width and height', true],
            ['content-box automatically sets element margins to zero', false],
            ['border-box removes borders completely on mobile devices', false],
            ['content-box is required for Flexbox and Grid layouts to operate', false]
        ]
    ],
    [
        'q' => 'Which of the following techniques is the most effective defense against SQL Injection vulnerabilities in PHP applications?',
        'marks' => 10,
        'explanation' => 'Prepared statements with parameterized queries ensure that SQL code and user input data are transmitted separately, preventing injection attacks.',
        'options' => [
            ['Using htmlspecialchars() on all incoming database parameters', false],
            ['Using PDO prepared statements with bound parameters', true],
            ['Checking input length with strlen() before execution', false],
            ['Converting all database input strings to uppercase', false]
        ]
    ],
    [
        'q' => 'In modern JavaScript (ES6+), what will be logged to the console: const a = [1, 2]; const b = [...a, 3]; console.log(b.length); ?',
        'marks' => 10,
        'explanation' => 'The spread operator (...) expands the elements of array "a" into a new array with element 3 appended, giving array [1, 2, 3] with length 3.',
        'options' => [
            ['2', false],
            ['3', true],
            ['4', false],
            ['Undefined', false]
        ]
    ],
    [
        'q' => 'What is the role of the Event Loop in JavaScript runtime environments (browsers and Node.js)?',
        'marks' => 10,
        'explanation' => 'The Event Loop monitors the Call Stack and the Task/Microtask Queues. When the stack is empty, it pushes queued callbacks onto the stack for execution.',
        'options' => [
            ['It executes multiple JavaScript threads simultaneously on multiple CPU cores', false],
            ['It coordinates non-blocking asynchronous operations by offloading tasks and executing callbacks when the stack clears', true],
            ['It minifies and transpiles ECMAScript code into bytecode', false],
            ['It encrypts all network requests before sending them across the wire', false]
        ]
    ],
    [
        'q' => 'Which CSS Flexbox property controls alignment of flex items along the cross axis?',
        'marks' => 10,
        'explanation' => '"align-items" aligns flex items along the cross axis (vertical in row orientation), whereas "justify-content" aligns along the main axis.',
        'options' => [
            ['justify-content', false],
            ['align-items', true],
            ['flex-direction', false],
            ['flex-wrap', false]
        ]
    ],
    [
        'q' => 'Which password hashing algorithm and function is recommended by PHP 8 for storing secure user credentials?',
        'marks' => 10,
        'explanation' => 'PHP provides password_hash($password, PASSWORD_BCRYPT) or PASSWORD_DEFAULT (Argon2/Bcrypt) which automatically generates secure random salts.',
        'options' => [
            ['md5($password)', false],
            ['sha1($password)', false],
            ['password_hash($password, PASSWORD_BCRYPT)', true],
            ['base64_encode($password)', false]
        ]
    ],
    [
        'q' => 'What is the semantic purpose of the HTML5 <article> element compared to <section>?',
        'marks' => 10,
        'explanation' => 'An <article> represents a complete, self-contained composition (such as a news article or forum post) that could independently be distributed.',
        'options' => [
            ['<article> is strictly for displaying blog posts and cannot contain headers or footers', false],
            ['<article> represents a self-contained, independently distributable piece of content', true],
            ['<section> can only be placed inside the <header> of a document', false],
            ['There is no functional or semantic difference between them', false]
        ]
    ],
    [
        'q' => 'In React, what is the primary reason for passing a unique "key" prop to elements rendered inside an array map?',
        'marks' => 10,
        'explanation' => 'Keys help React identify which items have changed, been added, or been removed, optimizing DOM reconciliation performance.',
        'options' => [
            ['Keys are required by CSS for applying flex item styles', false],
            ['Keys allow React\'s Virtual DOM reconciliation algorithm to efficiently track, update, and reuse DOM elements', true],
            ['Keys encrypt state values inside the browser LocalStorage', false],
            ['Keys automatically attach click event listeners to list items', false]
        ]
    ],
    [
        'q' => 'Which HTTP header is utilized by web servers to implement Cross-Origin Resource Sharing (CORS) permissions?',
        'marks' => 10,
        'explanation' => '"Access-Control-Allow-Origin" specifies which origins are permitted to access the server resources via asynchronous browser requests.',
        'options' => [
            ['Access-Control-Allow-Origin', true],
            ['X-Content-Type-Options', false],
            ['Strict-Transport-Security', false],
            ['Content-Security-Policy', false]
        ]
    ]
];

foreach ($quiz1Questions as $q) {
    $insQ = $db->prepare("INSERT INTO quiz_questions (quiz_id, question_text, marks, explanation) VALUES (?, ?, ?, ?)");
    $insQ->execute([$quiz1Id, $q['q'], $q['marks'], $q['explanation']]);
    $questionId = $db->lastInsertId();

    foreach ($q['options'] as $opt) {
        $insOpt = $db->prepare("INSERT INTO quiz_options (question_id, option_text, is_correct) VALUES (?, ?, ?)");
        $insOpt->execute([$questionId, $opt[0], $opt[1] ? 1 : 0]);
    }
}
echo "- Quiz 1 with 10 questions and explanations added.\n";

// Assignment for Course 1
$asSql = "INSERT INTO assignments (course_id, title, description, deadline, max_marks) VALUES (
    ?,
    'Capstone Project: Build a Responsive Full-Stack Dashboard',
    '### Assignment Overview
In this capstone assignment, you will synthesize the principles learned throughout the modules:
1. Design a multi-page responsive web layout with CSS Grid & Flexbox.
2. Implement dynamic data rendering from a PHP REST API endpoint.
3. Include client-side form validation and accessible HTML5 semantics.

### Submission Instructions
Submit your GitHub repository link or a zip archive containing your source code and database migration script before the deadline.',
    DATE_ADD(NOW(), INTERVAL 30 DAY),
    100
)";
$stmt = $db->prepare($asSql);
$stmt->execute([$c1Id]);
echo "- Assignment for Course 1 created.\n";

// ==========================================
// COURSE 2: PYTHON FOR DATA SCIENCE & AI
// ==========================================
$c2Sql = "INSERT INTO courses (title, short_description, full_description, category_id, instructor_id, difficulty, status) VALUES (
    'Python for Data Science, Analytics & Machine Learning',
    'Master Python data structures, NumPy matrix computing, Pandas data wrangling, Matplotlib visualizations, and Scikit-Learn models.',
    'A world-class data science program modeled after leading university curricula. You will transition from basic Python programming to performing advanced exploratory data analysis, data cleaning pipelines, and deploying supervised predictive machine learning models.

Modules include real-world datasets, hands-on Jupyter notebook walkthroughs, and quizzes testing statistical reasoning and algorithmic complexity.',
    ?, ?, 'beginner', 'published'
)";
$stmt = $db->prepare($c2Sql);
$stmt->execute([$dsCat, $instructorId]);
$c2Id = $db->lastInsertId();

$c2Modules = [
    [
        'title' => 'Module 1: Python Fundamentals for Scientific Computing',
        'lessons' => [
            [
                'title' => '1.1 Data Structures: Lists, Dictionaries, Sets & Comprehensions',
                'desc' => 'Master Pythonic data structures, memory layout, and list/dict comprehension patterns.',
                'video' => 'https://www.youtube.com/embed/kqtD5dpn9C8',
                'duration' => 24,
                'content' => "### Python Data Structures in Data Science

Python offers rich built-in data collections:
- **Lists (`[]`):** Ordered, mutable sequence of arbitrary objects.
- **Dictionaries (`{}`):** Hash-table based key-value mappings with O(1) average lookup.
- **Comprehensions:** Idiomatic, optimized syntax for data transformation:
```python
squares = [x**2 for x in range(10) if x % 2 == 0]
```"
            ],
            [
                'title' => '1.2 Functions, Scope, Lambda Expressions & Generators',
                'desc' => 'Higher-order functions, map/filter, lambda expressions, and memory-efficient generators.',
                'video' => 'https://www.youtube.com/embed/HGOBQPFzWKo',
                'duration' => 28,
                'content' => "### Memory-Efficient Generators

Generators yield values lazily one at a time, avoiding storing multi-gigabyte datasets in RAM:

```python
def read_large_dataset(filepath):
    with open(filepath, 'r') as file:
        for line in file:
            yield line.strip().split(',')
```"
            ]
        ]
    ],
    [
        'title' => 'Module 2: NumPy & Fast Vectorized Computation',
        'lessons' => [
            [
                'title' => '2.1 N-Dimensional Arrays (ndarray) & Vectorization',
                'desc' => 'Understand memory contiguity, C-level speedups, and avoiding Python for-loops via broadcasting.',
                'video' => 'https://www.youtube.com/embed/QUT1VHiLmmI',
                'duration' => 30,
                'content' => "### Why NumPy Vectorization is Essential

NumPy ndarrays store data in contiguous memory blocks, executing SIMD CPU vector instructions in optimized C code:

```python
import numpy as np

# Vectorized operation - 50x faster than standard Python loop
data = np.array([10.5, 22.1, 35.8])
normalized = (data - np.mean(data)) / np.std(data)
```"
            ]
        ]
    ],
    [
        'title' => 'Module 3: Pandas for Data Wrangling & Analysis',
        'lessons' => [
            [
                'title' => '3.1 DataFrames, Filtering, Missing Data & Imputation',
                'desc' => 'Read CSV/JSON data, handle nulls with fillna/dropna, and execute boolean indexing.',
                'video' => 'https://www.youtube.com/embed/vmEHCJofslg',
                'duration' => 35,
                'content' => "### Data Wrangling with Pandas

Handling missing data and data hygiene is 80% of data science:

```python
import pandas as pd

df = pd.read_csv('students_data.csv')
# Impute missing scores with the median
median_score = df['quiz_score'].median()
df['quiz_score'] = df['quiz_score'].fillna(median_score)
```"
            ]
        ]
    ]
];

foreach ($c2Modules as $mIdx => $m) {
    $insM = $db->prepare("INSERT INTO modules (course_id, title, order_index) VALUES (?, ?, ?)");
    $insM->execute([$c2Id, $m['title'], $mIdx + 1]);
    $mId = $db->lastInsertId();

    foreach ($m['lessons'] as $lIdx => $l) {
        $insL = $db->prepare("INSERT INTO lessons (module_id, title, description, video_url, duration, text_content, order_index) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $insL->execute([$mId, $l['title'], $l['desc'], $l['video'], $l['duration'], $l['content'], $lIdx + 1]);
    }
}

// Course 2 Quiz
$q2Sql = "INSERT INTO quizzes (course_id, title, passing_percentage) VALUES (?, 'Data Science & Python Foundations Quiz', 65.00)";
$stmt = $db->prepare($q2Sql);
$stmt->execute([$c2Id]);
$quiz2Id = $db->lastInsertId();

$quiz2Questions = [
    [
        'q' => 'What is the primary computational benefit of using NumPy arrays over standard Python lists for numerical operations?',
        'marks' => 20,
        'explanation' => 'NumPy arrays store elements in contiguous memory buffers and execute operations using compiled C-level vector routines, bypassing Python object overhead.',
        'options' => [
            ['NumPy arrays store elements in contiguous memory blocks with vectorized operations', true],
            ['NumPy arrays can store unlimited types within a single array', false],
            ['Python lists are compiled directly into assembly at runtime', false],
            ['NumPy arrays do not consume computer RAM', false]
        ]
    ],
    [
        'q' => 'In Pandas, which method is typically used to handle missing values (NaN) by substituting them with a computed statistic such as mean or median?',
        'marks' => 20,
        'explanation' => 'The fillna() method replaces missing NA/NaN values with a specified value or computed series.',
        'options' => [
            ['df.dropna()', false],
            ['df.fillna()', true],
            ['df.replace_na()', false],
            ['df.impute()', false]
        ]
    ],
    [
        'q' => 'In Python, what is the key difference between a normal function and a generator function that contains the "yield" keyword?',
        'marks' => 20,
        'explanation' => 'Generators produce sequence values lazily one at a time on demand, retaining execution state between yields rather than allocating all items in memory upfront.',
        'options' => [
            ['Generators execute on a remote GPU cluster', false],
            ['Generators produce values on demand lazily, saving memory when processing massive datasets', true],
            ['Functions with yield can only return integer numbers', false],
            ['There is no performance difference', false]
        ]
    ],
    [
        'q' => 'Which metric is most appropriate for evaluating the performance of a machine learning classifier on an imbalanced dataset?',
        'marks' => 20,
        'explanation' => 'F1-score (harmonic mean of Precision and Recall) or ROC-AUC provides a much more accurate evaluation than plain accuracy on skewed datasets.',
        'options' => [
            ['Raw Accuracy', false],
            ['F1-Score / Precision-Recall AUC', true],
            ['Mean Squared Error (MSE)', false],
            ['R-Squared Score', false]
        ]
    ],
    [
        'q' => 'In Pandas, which syntax is used to filter rows where the column "score" is strictly greater than 80?',
        'marks' => 20,
        'explanation' => 'Boolean indexing with df[df["score"] > 80] filters rows satisfying the boolean condition.',
        'options' => [
            ['df.where("score > 80")', false],
            ['df[df["score"] > 80]', true],
            ['df.filter(score > 80)', false],
            ['df.select("score", 80)', false]
        ]
    ]
];

foreach ($quiz2Questions as $q) {
    $insQ = $db->prepare("INSERT INTO quiz_questions (quiz_id, question_text, marks, explanation) VALUES (?, ?, ?, ?)");
    $insQ->execute([$quiz2Id, $q['q'], $q['marks'], $q['explanation']]);
    $questionId = $db->lastInsertId();

    foreach ($q['options'] as $opt) {
        $insOpt = $db->prepare("INSERT INTO quiz_options (question_id, option_text, is_correct) VALUES (?, ?, ?)");
        $insOpt->execute([$questionId, $opt[0], $opt[1] ? 1 : 0]);
    }
}
echo "- Course 2 created with modules, lessons, and 5-question quiz.\n";

// ==========================================
// COURSE 3: REACT 19 & MODERN FRONTEND
// ==========================================
$c3Sql = "INSERT INTO courses (title, short_description, full_description, category_id, instructor_id, difficulty, status) VALUES (
    'Modern React 19 & Component Architecture',
    'Master functional components, hooks (useState, useEffect, useMemo, custom hooks), React Router, and context API state management.',
    'Build reactive, modern single page applications with the latest React standard. Learn state lifting, custom hooks, performant memoization, API integration, and clean architecture used by senior frontend engineers.',
    ?, ?, 'intermediate', 'published'
)";
$stmt = $db->prepare($c3Sql);
$stmt->execute([$webCat, $instructorId]);
$c3Id = $db->lastInsertId();

$c3Modules = [
    [
        'title' => 'Module 1: React Fundamentals & JSX',
        'lessons' => [
            [
                'title' => '1.1 Thinking in React: Components, Props & Virtual DOM',
                'desc' => 'Component hierarchy, JSX transformation, props immutability, and unidirectional data flow.',
                'video' => 'https://www.youtube.com/embed/bMknfKXIFA8',
                'duration' => 25,
                'content' => "### Thinking in React

React applications are built out of isolated pieces of UI called components:
- **Components:** JavaScript functions that accept props and return JSX.
- **Virtual DOM:** A lightweight representation of the real DOM kept in memory, synced via the reconciliation process."
            ],
            [
                'title' => '1.2 State & Lifecycle: useState and useEffect in Action',
                'desc' => 'Managing local component state and handling side-effects, subscriptions, and cleanup functions.',
                'video' => 'https://www.youtube.com/embed/O6P86uwfdR0',
                'duration' => 30,
                'content' => "### useState and useEffect Rules

1. Only call hooks at the top level of your component.
2. Provide dependency arrays to `useEffect` to avoid infinite render loops:

```jsx
useEffect(() => {
  let isMounted = true;
  api.get('/data').then(res => {
    if (isMounted) setData(res.data);
  });
  return () => { isMounted = false; }; // Cleanup
}, []);
```"
            ]
        ]
    ]
];

foreach ($c3Modules as $mIdx => $m) {
    $insM = $db->prepare("INSERT INTO modules (course_id, title, order_index) VALUES (?, ?, ?)");
    $insM->execute([$c3Id, $m['title'], $mIdx + 1]);
    $mId = $db->lastInsertId();

    foreach ($m['lessons'] as $lIdx => $l) {
        $insL = $db->prepare("INSERT INTO lessons (module_id, title, description, video_url, duration, text_content, order_index) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $insL->execute([$mId, $l['title'], $l['desc'], $l['video'], $l['duration'], $l['content'], $lIdx + 1]);
    }
}
echo "- Course 3 created.\n";

// ==========================================
// COURSE 4: DATABASE SYSTEMS & SQL
// ==========================================
$c4Sql = "INSERT INTO courses (title, short_description, full_description, category_id, instructor_id, difficulty, status) VALUES (
    'Database Systems & Advanced SQL Engineering',
    'Relational database design, 3NF normalization, ACID transactions, complex JOINs, subqueries, and B-Tree indexing.',
    'Essential for every software engineer. Master the internal mechanics of relational database engines, query optimization with EXPLAIN plans, foreign key constraints, and concurrent transaction management.',
    ?, ?, 'advanced', 'published'
)";
$stmt = $db->prepare($c4Sql);
$stmt->execute([$dbCat, $instructorId]);
$c4Id = $db->lastInsertId();

$c4Modules = [
    [
        'title' => 'Module 1: Relational Modeling & Normalization',
        'lessons' => [
            [
                'title' => '1.1 Entity-Relationship Diagrams (ERD) & 1NF to 3NF',
                'desc' => 'Eliminating data redundancy, identifying functional dependencies, and designing robust schemas.',
                'video' => 'https://www.youtube.com/embed/ztHopE5Wnpc',
                'duration' => 28,
                'content' => "### Database Normalization Summary

- **1NF:** Each column contains atomic (indivisible) values, and each record is unique.
- **2NF:** In 1NF and all non-key attributes are fully dependent on the primary key (no partial dependencies).
- **3NF:** In 2NF and no non-key attribute is transitively dependent on the primary key (eliminates transitive dependencies)."
            ]
        ]
    ]
];

foreach ($c4Modules as $mIdx => $m) {
    $insM = $db->prepare("INSERT INTO modules (course_id, title, order_index) VALUES (?, ?, ?)");
    $insM->execute([$c4Id, $m['title'], $mIdx + 1]);
    $mId = $db->lastInsertId();

    foreach ($m['lessons'] as $lIdx => $l) {
        $insL = $db->prepare("INSERT INTO lessons (module_id, title, description, video_url, duration, text_content, order_index) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $insL->execute([$mId, $l['title'], $l['desc'], $l['video'], $l['duration'], $l['content'], $lIdx + 1]);
    }
}
echo "- Course 4 created.\n";

// ==========================================
// DEMO ENROLLMENT FOR STUDENT
// ==========================================
$studentId = $db->query("SELECT id FROM users WHERE email = 'student@learnsphere.com'")->fetchColumn() ?: 3;

// Enroll student in Course 1 with 2 lessons completed to show realistic Coursera progress bar
$db->prepare("INSERT INTO enrollments (student_id, course_id, progress_percentage, enrolled_at) VALUES (?, ?, 20.00, NOW())")
   ->execute([$studentId, $c1Id]);
$enrollmentId = $db->lastInsertId();

// Mark first 2 lessons as completed
$firstLessons = $db->query("SELECT id FROM lessons WHERE module_id IN (SELECT id FROM modules WHERE course_id = $c1Id) ORDER BY id ASC LIMIT 2")->fetchAll(PDO::FETCH_COLUMN);
foreach ($firstLessons as $lId) {
    $db->prepare("INSERT INTO lesson_progress (enrollment_id, lesson_id, is_completed, completed_at) VALUES (?, ?, 1, NOW())")
       ->execute([$enrollmentId, $lId]);
}

echo "====================================================\n";
echo "SUCCESS: Database successfully seeded with Coursera-level courses, modules, lessons, and multi-question quizzes!\n";
echo "====================================================\n";
