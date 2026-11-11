# LearnSphere LMS Requirements

## Functional Requirements
- **Students** must be able to register, log in, browse courses, enroll, view lessons, take quizzes, submit assignments, and download certificates.
- **Instructors** must be able to create and manage courses, modules, lessons, quizzes, and assignments, as well as grade submissions.
- **Administrators** must be able to manage all users, approve instructors, manage categories, and oversee system statistics.
- The system must track lesson progress and calculate course completion percentage automatically.

## Non-Functional Requirements
- **Security**: Passwords must be hashed using bcrypt. Prepared statements must be used to prevent SQL injection.
- **UI/UX**: The application must be fully responsive and follow modern design principles using Bootstrap 5.
- **Performance**: API responses should be in JSON format and return within 500ms.
- **Database**: The database must be normalized (3NF) and use proper foreign key constraints.

## Use Cases
1. **Enroll in Course**: Actor: Student. Flow: Browse -> Select Course -> Click Enroll -> Progress initialized to 0%.
2. **Create Course**: Actor: Instructor. Flow: Dashboard -> Create Course -> Fill Details -> Publish.
3. **Grade Assignment**: Actor: Instructor. Flow: View Submissions -> Evaluate -> Enter Marks -> Save.
