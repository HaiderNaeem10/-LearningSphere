# 🎓 LearnSphere LMS — Next-Generation Learning Management System

LearnSphere is a modern, universal-accessibility Learning Management System built with **React 19**, **Vite**, **Bootstrap 5**, and powered online by **Supabase** cloud database & authentication, configured for one-click deployment on **Netlify**.

---

## 🚀 Key Highlights & New Architecture

### 1. 📂 Sequenced Modules (1.1, 1.2, 1.3, 1.4...)
- The curriculum is broken into sequentially ordered modules:
  - **Module 1.1:** Semantic HTML5 & Modern Layout Architecture
  - **Module 1.2:** Responsive CSS3, Flexbox & Grid Systems
  - **Module 1.3:** Modern JavaScript (ES6+), Async & API Integration
  - **Module 1.4:** React Architecture, Custom Hooks & Reactive State Flow
- **Sequential Unlocks:** Module 1.1 is active by default upon enrollment. Subsequent modules remain locked until prior modules are certified.

### 2. 💡 Verified Reference Sample Solutions
- Every module includes an official, production-verified **Sample Solution** with architectural analysis.
- Students can view reference solutions, inspect clean-code patterns, and load the solution directly into the **Interactive Live Code Sandbox** with one click.

### 3. 📡 Active Learning & System Working Checks
- Integrated telemetry actively logs student presence and study sessions on each module.
- Includes a live session timer and **"Verify Active Working Check"** checkpoint that confirms the student is actively engaged with the curriculum.

### 4. ⚡ Module Quizzes & 🔒 Locked Final Examination
- **Module Quizzes:** Each module features a tailored comprehension quiz.
- **Mastery-Gated Final Exam:** The comprehensive Final Course Examination remains strictly **LOCKED 🔒** until all prior curriculum modules (1.1 through 1.4) are 100% completed.
- Once all modules are certified, the final exam automatically unlocks to evaluate end-to-end competency.

### 5. 📜 Certificate Generation & Email Dispatch
- Upon passing the final assessment (threshold: 70%+), an official digital certificate is generated with a unique cryptographic verification ID (e.g., `LS-XXXXX-XXXXX`).
- **Email Delivery:** Students can input or confirm their existing, verified email address to receive an official digital credential copy directly in their inbox.
- **PDF & Print Ready:** Includes digital seals, academic signatures, and a dedicated print layout.

---

## 🌐 Deploying to Netlify (Live Web)

The repository includes a pre-configured [`netlify.toml`](./netlify.toml) and [`_redirects`](./frontend/public/_redirects) for clean Single-Page Application (SPA) routing.

### Option A: Automatic Git-Connected Deployment (Recommended)
1. Go to [app.netlify.com](https://app.netlify.com) and log in.
2. Click **"Add new site"** &rarr; **"Import an existing project"**.
3. Select **GitHub** and choose the repository:
   ```
   HaiderNaeem10/-LearningSphere
   ```
4. Netlify will automatically detect the build settings from `netlify.toml`:
   - **Base directory:** `frontend`
   - **Build command:** `npm run build`
   - **Publish directory:** `frontend/dist`
5. Click **"Deploy Site"**. Netlify will build and generate your public live URL (e.g., `https://learnsphere-lms.netlify.app`).

### Option B: Instant Drag-and-Drop Deploy (Zero Setup)
1. Build the production bundle locally:
   ```bash
   npm run build --prefix frontend
   ```
2. Open [app.netlify.com/drop](https://app.netlify.com/drop) in your browser.
3. Drag and drop the `frontend/dist` folder directly onto the page.
4. Your site will be published instantly with a live `.netlify.app` domain!

---

## 🗄️ Supabase Cloud Database Configuration

The application is connected to the Supabase cloud project:
- **Project Ref:** `yojsslbmcfxpodxqwcmr`
- **Region:** `ap-southeast-1`

### Environment Variables
Configure these in Netlify (*Site settings &rarr; Environment variables*) or in `frontend/.env`:
```dotenv
VITE_SUPABASE_URL=https://yojsslbmcfxpodxqwcmr.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvanNzbGJtY2Z4cG9keHF3Y21yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQzNjI0MzQsImV4cCI6MjEwOTkzODQzNH0.SPer5TDz6fjlhebTRfKCpcJ0ZQrv-5KhpyYSa0oLSsM
```

---

## 💻 Local Development Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/HaiderNaeem10/-LearningSphere.git
   cd -LearningSphere
   ```

2. **Install frontend dependencies:**
   ```bash
   cd frontend
   npm install
   ```

3. **Start the local Vite development server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

4. **Run Desktop App (Electron):**
   ```bash
   npm run desktop
   ```

---

## 📁 Repository Structure

```
LearningSphere/
├── frontend/
│   ├── src/
│   │   ├── components/            # Navbar, AccessibilityToolbar, Walkthrough
│   │   ├── context/               # AuthContext, AccessibilityContext, LanguageContext
│   │   ├── pages/                 # Courses, CourseDetails, CoursePlayer, QuizPage, Certificate
│   │   ├── services/
│   │   │   ├── courseService.js   # Module sequencing, sample solutions, checks, certificates
│   │   │   ├── courseData.js      # Curriculum templates (Modules 1.1 - 1.4, solutions, quizzes)
│   │   │   ├── supabaseClient.js  # Resilient Supabase client
│   │   │   └── api.js             # REST API bridge
│   │   └── App.jsx                # Route definitions
│   ├── public/
│   │   └── _redirects             # SPA fallback for Netlify CDN
│   ├── package.json
│   └── vite.config.js
├── netlify.toml                   # Netlify build & redirect configuration
├── supabase_schema.sql            # PostgreSQL / Supabase table schema
└── README.md                      # Documentation
```

---

## 📜 License
Distributed under the MIT License. Developed for universal accessibility and modern interactive computing education.
