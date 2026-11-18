// Course catalog and interactive module data with:
// - Modules structured as 1.1, 1.2, 1.3, 1.4...
// - Sample solutions for each module
// - Verification checks so system tracks student actively working on modules
// - Module-specific quizzes
// - Final Examination that stays locked until all modules are 100% completed
// - Certificate issuance & email delivery

export const DEFAULT_COURSES = [
  {
    id: 1,
    title: "Full Stack Web Development",
    short_description: "Master modern web development from HTML/CSS to React, Node.js, PHP, and cloud databases.",
    full_description: `Become a versatile full-stack software engineer. This comprehensive curriculum takes you step-by-step through front-end user interfaces, reactive state management, server-side APIs, database architecture, and cloud deployment.

Each module is sequentially numbered (1.1, 1.2, 1.3, 1.4...) with interactive checkpoints and verified sample solutions. Complete all modules to unlock the Final Certification Exam and receive your accredited digital credential.`,
    category: "Web Development",
    difficulty: "intermediate",
    instructor: "Dr. Sarah Mitchell",
    instructor_bio: "Principal Software Architect and educator with 12+ years of industry experience building scalable distributed web applications.",
    thumbnail: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&auto=format&fit=crop&q=80",
    modules: [
      {
        id: 101,
        code: "1.1",
        title: "Semantic HTML5 & Modern Layout Architecture",
        description: "Master document structure, accessibility standards (ARIA), and SEO-friendly semantic layouts.",
        is_locked: false,
        is_completed: false,
        sample_solution: `<!-- Module 1.1 Verified Reference Solution: Accessible Header & Semantic Article -->
<header class="site-header" role="banner">
  <nav aria-label="Primary Navigation">
    <a href="#main-content" class="skip-link">Skip to Content</a>
    <ul class="nav-list">
      <li><a href="/" aria-current="page">Home</a></li>
      <li><a href="/curriculum">Curriculum</a></li>
      <li><a href="/labs">Interactive Labs</a></li>
    </ul>
  </nav>
</header>
<main id="main-content" tabindex="-1">
  <article class="lesson-card" aria-labelledby="lesson-title">
    <h1 id="lesson-title">Modern Full-Stack Principles</h1>
    <p>Semantic markup ensures high screen-reader fidelity and optimal Lighthouse audits.</p>
  </article>
</main>`,
        solution_explanation: "This solution demonstrates correct semantic tagging (<header>, <nav>, <main>, <article>), accessibility skip-links, and ARIA attributes compliant with WCAG 2.1 AA standards.",
        lessons: [
          {
            id: 1001,
            title: "Document Anatomy & Semantic Tags",
            description: "Understanding DOM hierarchies, head metadata, and modern landmark tags.",
            duration: 15,
            video_url: "https://www.youtube-nocookie.com/embed/kUMe1FH4CHE",
            text_content: `### Module 1.1: Semantic HTML5 Architecture
Semantic HTML provides meaning to web content beyond visual representation.

Key Landmark Elements:
- \`<header>\`: Introductory content or navigational aids.
- \`<nav>\`: Major navigation blocks.
- \`<main>\`: The dominant content unique to the document.
- \`<section>\`: Thematic grouping of content with a heading.
- \`<article>\`: Self-contained, independently distributable composition.

Best Practice: Always verify with screen-reader tools and use landmark roles to boost web accessibility.`
          },
          {
            id: 1002,
            title: "Web Accessibility (A11y) & ARIA Standards",
            description: "Implementing keyboard navigability, focus traps, and screen-reader tags.",
            duration: 20,
            video_url: "https://www.youtube-nocookie.com/embed/20SHvU2PKsM",
            text_content: `Accessibility is a first-class requirement. 
- Use \`aria-label\` where visual labels are omitted.
- Ensure all interactive elements receive clear \`:focus-visible\` styles.
- Keep contrast ratios at or above 4.5:1 for body text.`
          }
        ],
        quiz: {
          id: "quiz-1.1",
          title: "Module 1.1 Quiz: HTML5 & Accessibility",
          passing_percentage: 75,
          questions: [
            {
              id: 1,
              question: "Which HTML5 landmark tag should only appear once per page for unique content?",
              options: ["<header>", "<section>", "<main>", "<nav>"],
              correct: 2,
              explanation: "The <main> tag represents the dominant content unique to the document and must not be repeated."
            },
            {
              id: 2,
              question: "What is the primary objective of WCAG contrast ratio requirements?",
              options: [
                "To decrease overall CSS file payload",
                "To ensure text is comfortably legible for users with low vision",
                "To restrict browser caching",
                "To speed up DOM parsing"
              ],
              correct: 1,
              explanation: "Minimum contrast (4.5:1 for regular text) guarantees readability across various vision profiles."
            }
          ]
        }
      },
      {
        id: 102,
        code: "1.2",
        title: "Responsive CSS3, Flexbox & Grid Systems",
        description: "Create fluid, mobile-first responsive layouts using CSS Grid and Flexbox alignment.",
        is_locked: true,
        is_completed: false,
        sample_solution: `/* Module 1.2 Verified Reference Solution: Responsive Card Grid */
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  padding: 1.5rem;
}

.card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  border-radius: 12px;
  background: #ffffff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.12);
}`,
        solution_explanation: "This snippet uses dynamic auto-fit grid calculation with minmax boundaries so the layout automatically shifts between 1, 2, and 3 columns on mobile, tablet, and desktop without rigid media queries.",
        lessons: [
          {
            id: 1003,
            title: "CSS Grid vs Flexbox: When to Use Which",
            description: "Two-dimensional layout coordination with CSS Grid vs one-dimensional alignment with Flexbox.",
            duration: 25,
            video_url: "https://www.youtube-nocookie.com/embed/9zBsdzdE4sM",
            text_content: `Flexbox is ideal for single-axis alignments (such as navigation menus, toolbars, and buttons).
CSS Grid is built for 2-dimensional matrix systems (rows + columns).

\`repeat(auto-fit, minmax(250px, 1fr))\` allows responsive cards to wrap naturally across all screen resolutions.`
          }
        ],
        quiz: {
          id: "quiz-1.2",
          title: "Module 1.2 Quiz: Responsive Layouts",
          passing_percentage: 70,
          questions: [
            {
              id: 1,
              question: "Which CSS display property is best suited for 2-dimensional page layouts?",
              options: ["inline-block", "flex", "grid", "table-row"],
              correct: 2,
              explanation: "CSS Grid is inherently two-dimensional, allowing control over both rows and columns simultaneously."
            }
          ]
        }
      },
      {
        id: 103,
        code: "1.3",
        title: "Modern JavaScript (ES6+), Async & API Integration",
        description: "Harness asynchronous JavaScript, promises, async/await, and RESTful data fetching.",
        is_locked: true,
        is_completed: false,
        sample_solution: `// Module 1.3 Verified Reference Solution: Robust Async Data Fetcher
async function fetchCourseModules(courseId, signal) {
  try {
    const response = await fetch(\`/api/courses/\${courseId}/modules\`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': \`Bearer \${localStorage.getItem('token') || ''}\`
      },
      signal
    });

    if (!response.ok) {
      throw new Error(\`Network response failed with status \${response.status}\`);
    }

    const payload = await response.json();
    return { success: true, data: Array.isArray(payload) ? payload : [] };
  } catch (err) {
    if (err.name === 'AbortError') return { success: false, aborted: true };
    console.error('Fetch error:', err.message);
    return { success: false, error: err.message, data: [] };
  }
}`,
        solution_explanation: "Includes abort signal support for cleanup in useEffect hooks, authorization headers, defensive status verification, and safe fallback return signatures.",
        lessons: [
          {
            id: 1004,
            title: "Promises, Async/Await & Error Boundaries",
            description: "Writing non-blocking asynchronous JavaScript code with proper error containment.",
            duration: 30,
            video_url: "https://www.youtube-nocookie.com/embed/PoRJizFvM7s",
            text_content: `Always wrap asynchronous network operations in \`try...catch\` blocks and validate server payloads before mutating state.`
          }
        ],
        quiz: {
          id: "quiz-1.3",
          title: "Module 1.3 Quiz: Asynchronous JS",
          passing_percentage: 75,
          questions: [
            {
              id: 1,
              question: "What does an async function in JavaScript always return?",
              options: ["A callback", "A Promise", "An EventListener", "An Observable"],
              correct: 1,
              explanation: "Async functions always wrap their return value in a resolved or rejected Promise."
            }
          ]
        }
      },
      {
        id: 104,
        code: "1.4",
        title: "React Architecture, Custom Hooks & State Flow",
        description: "Build reactive single-page applications with declarative state, effects, and custom hooks.",
        is_locked: true,
        is_completed: false,
        sample_solution: `// Module 1.4 Verified Reference Solution: Custom useModuleProgress Hook
import { useState, useEffect, useCallback } from 'react';

export function useModuleProgress(studentId, courseId) {
  const [completedModules, setCompletedModules] = useState([]);
  const [isFinalUnlocked, setIsFinalUnlocked] = useState(false);

  const markModuleComplete = useCallback((moduleId) => {
    setCompletedModules(prev => {
      const next = Array.from(new Set([...prev, moduleId]));
      return next;
    });
  }, []);

  return { completedModules, isFinalUnlocked, markModuleComplete };
}`,
        solution_explanation: "Demonstrates idiomatic React custom hooks with memoized callbacks and immutability guarantees.",
        lessons: [
          {
            id: 1005,
            title: "Reactive State Management & Effect Cycles",
            description: "Component lifecycles, hook optimization, and avoiding memory leaks.",
            duration: 35,
            video_url: "https://www.youtube-nocookie.com/embed/bMknfKXIFA8",
            text_content: `React components re-render when state or props change. Keep state minimal and derive values whenever possible.`
          }
        ],
        quiz: {
          id: "quiz-1.4",
          title: "Module 1.4 Quiz: React Component Architecture",
          passing_percentage: 75,
          questions: [
            {
              id: 1,
              question: "Which React hook is used to perform side effects such as data subscriptions or timer cleanups?",
              options: ["useState", "useMemo", "useEffect", "useId"],
              correct: 2,
              explanation: "useEffect is specifically designed for side effects, network subscriptions, and cleanup lifecycles."
            }
          ]
        }
      }
    ],
    final_exam: {
      id: "final-exam-1",
      title: "Full Stack Web Development: Comprehensive Final Certification Exam",
      description: "Demonstrate mastery across all 4 modules (1.1, 1.2, 1.3, and 1.4) to earn your verified credential.",
      passing_percentage: 70,
      questions: [
        {
          id: 201,
          question: "Which combination of technologies satisfies a complete modern full-stack web architecture?",
          options: [
            "Semantic HTML/React (Frontend) + REST/PHP/Node.js (Backend) + SQL/Supabase (Database)",
            "CSS Grid only + LocalStorage",
            "XML + FTP + Desktop Executable",
            "Static Text Files without HTTP"
          ],
          correct: 0,
          explanation: "Modern full-stack architecture cleanly decouples client presentation from server APIs and persistent databases."
        },
        {
          id: 202,
          question: "Why must course final exams remain locked until prior curriculum modules are certified?",
          options: [
            "To artificially delay student progress",
            "To enforce mastery learning, pedagogical sequencing, and prerequisite competency",
            "Because browsers cannot load locked links",
            "To reduce server bandwidth"
          ],
          correct: 1,
          explanation: "Mastery learning pedagogy ensures that foundational prerequisites are thoroughly grasped before comprehensive assessment."
        },
        {
          id: 203,
          question: "How should state management respond when an asynchronous API call encounters a network drop?",
          options: [
            "Let the application crash with a white screen",
            "Silently disregard the error without informing the user",
            "Catch the error, set a friendly fallback status, and present retry controls",
            "Restart the entire operating system"
          ],
          correct: 2,
          explanation: "Graceful error recovery, fallback states, and user retry indicators are vital for resilient production software."
        },
        {
          id: 204,
          question: "What is the security advantage of verifying user email addresses before dispatching academic certificates?",
          options: [
            "It validates legitimate identity ownership and guarantees verifiable credential receipt",
            "It prevents CSS stylesheets from breaking",
            "It speeds up SQL queries",
            "It shrinks JPEG image file sizes"
          ],
          correct: 0,
          explanation: "Authenticating student email addresses prevents credential spoofing and ensures the rightful achiever receives verifiable accreditation."
        }
      ]
    }
  },
  {
    id: 2,
    title: "Data Science & Machine Learning with Python",
    short_description: "From data wrangling with Pandas to machine learning model deployment and exploratory analytics.",
    full_description: `Learn how data-driven organizations leverage Python, NumPy, Pandas, and Scikit-Learn to uncover insights and build predictive algorithms.

Structured into sequenced modules 1.1 through 1.3 with verified code solutions, interactive data checks, module assessments, and a locked final certification exam.`,
    category: "Data Science",
    difficulty: "beginner",
    instructor: "Prof. Michael Chang",
    instructor_bio: "Data Scientist & researcher specializing in predictive modeling and computational statistics.",
    thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80",
    modules: [
      {
        id: 201,
        code: "1.1",
        title: "Python for Data Analysis Fundamentals",
        description: "Variables, list comprehensions, NumPy vectorization, and data structures.",
        is_locked: false,
        is_completed: false,
        sample_solution: `# Module 1.1 Verified Reference Solution: Vectorized Normalization
import numpy as np

def min_max_normalize(data_array):
    """Normalize numeric vector into [0, 1] range."""
    arr = np.array(data_array, dtype=float)
    min_val = np.min(arr)
    max_val = np.max(arr)
    if max_val == min_val:
        return np.zeros_like(arr)
    return (arr - min_val) / (max_val - min_val)

sample_data = [12.5, 45.0, 78.2, 99.4, 23.1]
print("Normalized Output:", min_max_normalize(sample_data))`,
        solution_explanation: "Calculates range boundaries and scales vectors with zero-division protection.",
        lessons: [
          {
            id: 2001,
            title: "NumPy Arrays & Mathematical Operations",
            description: "High-performance vector and matrix calculations.",
            duration: 20,
            video_url: "https://www.youtube-nocookie.com/embed/QUT1VHiLmmI",
            text_content: `NumPy arrays are up to 50x faster than standard Python lists due to contiguous C-level memory allocations.`
          }
        ],
        quiz: {
          id: "quiz-2.1",
          title: "Module 1.1 Quiz: Python Data Basics",
          passing_percentage: 70,
          questions: [
            {
              id: 1,
              question: "What NumPy feature allows mathematical operations across whole arrays without explicit for-loops?",
              options: ["Garbage collection", "Vectorization", "Recursion", "Pickling"],
              correct: 1,
              explanation: "Vectorization performs batched SIMD operations at hardware speed."
            }
          ]
        }
      },
      {
        id: 202,
        code: "1.2",
        title: "Data Cleaning & Exploration with Pandas",
        description: "Handling missing values, grouping, pivot tables, and statistical summaries.",
        is_locked: true,
        is_completed: false,
        sample_solution: `# Module 1.2 Verified Reference Solution: Imputation & Aggregation
import pandas as pd

def clean_dataset(df):
    df_clean = df.copy()
    # Fill numeric nulls with median
    num_cols = df_clean.select_dtypes(include=['float64', 'int64']).columns
    df_clean[num_cols] = df_clean[num_cols].fillna(df_clean[num_cols].median())
    return df_clean`,
        solution_explanation: "Safely imputes missing values using robust column-wise median statistics.",
        lessons: [
          {
            id: 2002,
            title: "Pandas DataFrames & Series",
            description: "Data manipulation workflows for real-world tabular data.",
            duration: 25,
            video_url: "https://www.youtube-nocookie.com/embed/dcqPhpQ7dVE",
            text_content: `Master indexing with .loc[] and .iloc[] for precise data slicing.`
          }
        ],
        quiz: {
          id: "quiz-2.2",
          title: "Module 1.2 Quiz: Pandas Essentials",
          passing_percentage: 75,
          questions: [
            {
              id: 1,
              question: "Which Pandas method calculates descriptive statistics including mean, min, and quartiles?",
              options: [".info()", ".describe()", ".head()", ".shape()"],
              correct: 1,
              explanation: ".describe() produces a comprehensive statistical summary of numerical features."
            }
          ]
        }
      }
    ],
    final_exam: {
      id: "final-exam-2",
      title: "Data Science with Python: Final Certification Exam",
      description: "Pass this comprehensive assessment to verify your data science expertise and generate your certificate.",
      passing_percentage: 70,
      questions: [
        {
          id: 301,
          question: "When cleaning a skewed dataset with extreme outliers, why is the median often favored over the mean for imputation?",
          options: [
            "The median is sensitive to outliers and exaggerates variance",
            "The median is a robust metric that is not skewed by extreme values",
            "The mean is computationally impossible to calculate in Python",
            "Pandas cannot compute standard deviations"
          ],
          correct: 1,
          explanation: "The median represents the 50th percentile and resists distortion from extreme tail outliers."
        },
        {
          id: 302,
          question: "What is the primary function of training vs test dataset splitting in predictive modeling?",
          options: [
            "To reduce the size of the CSV file",
            "To evaluate how well the model generalizes to unseen real-world data",
            "To format data for HTML rendering",
            "To duplicate rows for redundancy"
          ],
          correct: 1,
          explanation: "Hold-out testing evaluates generalization and helps detect overfitting."
        }
      ]
    }
  }
];
