# LearnSphere LMS

## Overview
LearnSphere is a React + Vite learning management system that now runs **entirely on Supabase** for data storage, authentication, and progress tracking, and is deployed on **Netlify**.

## Features
- Supabase Auth (email/password) – no PHP backend required.
- Courses are split into ordered **modules** (e.g., `1.1`, `1.2`, …) with optional **sample solutions**.
- **Module progress** is tracked per student (`module_progress`).
- Each module can have a **quiz**; a final course quiz is locked until all modules are completed.
- Upon successful completion, a **certificate** is generated and emailed to the student.
- Admin/Instructor UI for assigning courses, adding modules, quizzes, and managing users.

## Project Structure
```
LearningSphere/
├─ frontend/               # Vite + React source
│  ├─ src/
│  │  ├─ components/       # UI components
│  │  ├─ context/          # AuthContext, LanguageContext, etc.
│  │  └─ services/         # supabaseClient, moduleService, enrollmentService, …
│  └─ public/
├─ supabase_schema.sql     # Full Supabase schema (modules, quizzes, certificates)
├─ README.md               # <--- this file
└─ package.json
```

## Getting Started (Local Development)
1. **Clone the repo** (if you haven't already):
   ```bash
   git clone https://github.com/<YOUR_USER>/learnsphere-lms.git
   cd learnsphere-lms
   ```
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Create a Supabase project**
   - Go to https://app.supabase.com and create a new project (free tier is fine).
   - In the Supabase console, open **SQL editor** and run the contents of `supabase_schema.sql`.
   - Copy the **Project URL** and **anon public key** from **Settings → API**.
4. **Configure environment variables**
   Create a `.env` file inside `frontend/`:
   ```dotenv
   VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
   VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
   ```
5. **Run the dev server**:
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:5173`.

## Deploying to Netlify
1. **Push the repo to GitHub** (or GitLab/Bitbucket).
2. **Create a new site** in Netlify → *New site from Git* → select your repo.
3. **Build settings**:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/dist`
4. **Add environment variables** (Settings → Build & Deploy → Environment):
   - `VITE_SUPABASE_URL` – your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` – your anon key
5. Click **Deploy site**. After the build finishes Netlify will provide a live URL, e.g. `https://learnsphere-lms.netlify.app`.

## Supabase Schema Overview
The file `supabase_schema.sql` contains:
- `profiles` – extra user info (name, role).
- `courses`, `enrollments` – core LMS objects.
- `modules` – ordered modules (`order` column, `code` like `1.1`).
- `module_progress` – tracks each student’s completion status.
- `quizzes` & `quiz_attempts` – per‑module and final course quizzes.
- `certificates` – rows generated after a student passes the final quiz; a Netlify function can create a PDF and store the URL.
- Basic Row‑Level Security (RLS) policies for students vs. instructors.

## How the Flow Works
1. **Student signs up / logs in** – Supabase Auth creates a `profiles` row.
2. **Enroll in a course** – call `enrollInCourse(studentId, courseId)` from `enrollmentService.js`. This creates an enrollment and unlocks the first module.
3. **Module UI** – `getModules(courseId)` fetches ordered modules. When a student completes a module, call `completeModule(studentId, moduleId)` and then `unlockNextModule(courseId, currentOrder)`.
4. **Quiz** – after a module is marked completed, the UI can present a quiz. On passing, the module is marked completed and the next module unlocks.
5. **Final quiz & certificate** – when the final quiz is passed, insert a row into `certificates` and trigger a Netlify function that emails the certificate link to the student’s email.

## Emailing Certificates
A simple Netlify Function (`netlify/functions/sendCertificate.js`) can be used:
```js
const nodemailer = require('nodemailer');
exports.handler = async (event) => {
  const { email, certificateUrl } = JSON.parse(event.body);
  // configure transporter (use your SMTP provider)
  const transporter = nodemailer.createTransport({ /* ... */ });
  await transporter.sendMail({ from: 'no-reply@learnsphere.com', to: email,
    subject: 'Your LearnSphere Certificate',
    html: `<p>Congratulations! Here is your certificate: <a href="${certificateUrl}">View</a></p>` });
  return { statusCode: 200, body: JSON.stringify({ success: true }) };
};
```
When a certificate row is created, call this function with the student’s email and the generated URL.

## Contributing
1. Fork the repository.
2. Create a feature branch.
3. Make your changes and ensure the app still builds (`npm run build`).
4. Open a Pull Request.

## License
MIT – feel free to use, modify, and distribute.

---
*Generated by Antigravity – your AI‑powered coding assistant.*