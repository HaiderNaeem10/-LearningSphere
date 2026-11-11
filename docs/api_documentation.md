# LearnSphere API Documentation

## Base URL
`/api`

## Authentication Endpoints
- `POST /auth/register.php`: Register a new user. Required: name, email, password, role.
- `POST /auth/login.php`: Authenticate user and return JWT/Session. Required: email, password.
- `GET /auth/me.php`: Get current authenticated user details.

## Courses Endpoints
- `GET /courses/list.php`: Fetch all published courses. Supports filters.
- `GET /courses/details.php?id={id}`: Get full details of a course including modules.
- `POST /courses/create.php`: [Instructor] Create a new course.
- `PUT /courses/update.php`: [Instructor] Update an existing course.
- `DELETE /courses/delete.php`: [Instructor/Admin] Delete a course.

*(Other endpoints will follow standard CRUD structures)*
