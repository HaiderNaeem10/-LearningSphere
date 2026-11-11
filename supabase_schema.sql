/* Supabase schema for LearningSphere LMS – extended features */

-- 1. Profiles (already exists, kept for reference)
create table if not exists profiles (
  id uuid primary key references auth.users not null,
  name text,
  role text check (role in ('admin','instructor','student')) default 'student',
  created_at timestamp default now()
);

-- 2. Courses (already exists, kept for reference)
create table if not exists courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  short_description text,
  category text,
  instructor_id uuid references profiles(id),
  created_at timestamp default now()
);

-- 3. Enrollments (already exists, kept for reference)
create table if not exists enrollments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references profiles(id),
  course_id uuid references courses(id),
  progress numeric default 0,
  assigned_by uuid references profiles(id),
  created_at timestamp default now()
);

-- 4. Modules – each course is split into ordered modules (e.g., 1.1, 1.2 …)
create table if not exists modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references courses(id) not null,
  "order" integer not null,                 -- integer order within the course
  code text generated always as (concat(course_id::text, '.', "order"::text)) stored, -- e.g., 1.1, 1.2
  title text not null,
  description text,
  sample_solution text,                     -- optional sample solution for the module
  locked boolean default true,               -- locked until previous module completed
  created_at timestamp default now()
);

-- 5. Lessons – optional finer‑grained steps inside a module
create table if not exists lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid references modules(id) not null,
  "order" integer not null,
  title text not null,
  content text,
  created_at timestamp default now()
);

-- 6. ModuleProgress – tracks a student's progress per module
create table if not exists module_progress (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references profiles(id) not null,
  module_id uuid references modules(id) not null,
  completed boolean default false,
  started_at timestamp default now(),
  completed_at timestamp,
  check (student_id <> module_id) -- just a sanity check
);

-- 7. Quizzes – one per module (optional) and a final quiz per course
create table if not exists quizzes (
  id uuid primary key default gen_random_uuid(),
  module_id uuid references modules(id),      -- null for final course quiz
  course_id uuid references courses(id),
  title text not null,
  questions jsonb,                           -- array of question objects
  passing_score numeric not null default 70,
  created_at timestamp default now()
);

-- 8. QuizAttempts – records a student's attempt at a quiz
create table if not exists quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references profiles(id) not null,
  quiz_id uuid references quizzes(id) not null,
  score numeric,
  passed boolean,
  attempt_at timestamp default now()
);

-- 9. Certificates – generated once a student finishes a course
create table if not exists certificates (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references profiles(id) not null,
  course_id uuid references courses(id) not null,
  issued_at timestamp default now(),
  certificate_url text,                      -- link to generated PDF/HTML
  unique (student_id, course_id)
);

/*
  RLS policies – example skeleton (customise per role)
*/

-- Enable RLS on new tables
alter table modules enable row level security;
alter table module_progress enable row level security;
alter table quizzes enable row level security;
alter table quiz_attempts enable row level security;
alter table certificates enable row level security;

-- Students can only view their own progress / attempts / certificates
create policy "student_read_own" on module_progress for select using (auth.uid() = student_id);
create policy "student_insert_progress" on module_progress for insert with check (auth.uid() = student_id);
create policy "student_read_own_quiz" on quiz_attempts for select using (auth.uid() = student_id);
create policy "student_insert_attempt" on quiz_attempts for insert with check (auth.uid() = student_id);
create policy "student_read_certificate" on certificates for select using (auth.uid() = student_id);

-- Instructors can manage modules/quizzes for courses they own
create policy "instructor_manage_modules" on modules for all using (auth.uid() = (select instructor_id from courses where id = course_id));
create policy "instructor_manage_quizzes" on quizzes for all using (auth.uid() = (select instructor_id from courses where id = course_id));
