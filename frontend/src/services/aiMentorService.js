// LearnSphere AI Mentor & Oral Viva Examination Intelligence Engine

export const VIVA_CURRICULUM_POOLS = {
  // Course 1: Full Stack Web Development
  1: [
    {
      id: "viva-1",
      moduleCode: "1.1",
      topic: "Semantic Architecture & Accessibility",
      question: "Can you explain why semantic HTML tags are preferred over generic <div> containers, particularly regarding web accessibility and browser rendering?",
      expectedKeywords: ["accessibility", "screen reader", "landmark", "seo", "dom", "aria", "meaning", "parser"],
      followUps: [
        "How would you ensure that a custom modal dialog retains proper keyboard focus management for a screen-reader user?",
        "What specific WCAG contrast ratio is mandated for standard body text, and why does it matter?"
      ],
      idealAnswerSummary: "Semantic tags (<header>, <main>, <article>, <nav>) convey explicit structural semantics to accessibility assistive tools and user-agent parsers without relying on arbitrary CSS class heuristics."
    },
    {
      id: "viva-2",
      moduleCode: "1.2",
      topic: "CSS Grid vs Flexbox Layout Dynamics",
      question: "In high-traffic responsive applications, under what architectural conditions would you choose CSS Grid over Flexbox, and how do their rendering axes differ?",
      expectedKeywords: ["two-dimensional", "rows and columns", "flexbox", "one-dimensional", "grid", "axis", "auto-fit", "minmax"],
      followUps: [
        "Explain how repeat(auto-fit, minmax(...)) prevents the need for hardcoded media queries across device screens.",
        "What happens when flex-shrink is set to 0 versus 1 when container space shrinks?"
      ],
      idealAnswerSummary: "CSS Grid manages 2-dimensional layouts (rows and columns simultaneously), whereas Flexbox excels in 1-dimensional content distribution along either the main or cross axis."
    },
    {
      id: "viva-3",
      moduleCode: "1.3",
      topic: "Asynchronous JavaScript & Event Loop",
      question: "Walk me through how the JavaScript event loop, microtask queue, and call stack prioritize a resolved Promise versus a setTimeout callback.",
      expectedKeywords: ["microtask", "macrotask", "task queue", "call stack", "event loop", "promise", "settimeout", "priority"],
      followUps: [
        "Why does an unhandled Promise rejection halt subsequent asynchronous pipeline steps in Node.js?",
        "How does the browser handle UI repaints relative to microtask completion?"
      ],
      idealAnswerSummary: "Microtasks (Promises, queueMicrotask) have strict priority over macrotasks (setTimeout, setInterval). The microtask queue is drained completely before the event loop processes the next macrotask."
    },
    {
      id: "viva-4",
      moduleCode: "1.4",
      topic: "React Component State & Reconciliation",
      question: "How does React's Virtual DOM reconciliation engine identify which components need re-rendering, and why are stable keys essential in dynamic lists?",
      expectedKeywords: ["virtual dom", "reconciliation", "diffing", "keys", "fiber", "render", "state", "props", "immutability"],
      followUps: [
        "What potential rendering bug occurs when using array indices as keys during list item insertion or deletion?",
        "When would you use useMemo or useCallback, and what performance cost do they introduce if overused?"
      ],
      idealAnswerSummary: "React diffs virtual DOM trees using heuristic reconciliation. Stable, unique keys allow React to track element identity across re-orders and insertions without destroying and recreating DOM nodes unnecessarily."
    }
  ],

  // Course 2: Data Science
  2: [
    {
      id: "viva-ds-1",
      moduleCode: "1.1",
      topic: "NumPy Vectorization & Memory Efficiency",
      question: "Why does vectorized computation in NumPy achieve up to 50 times greater throughput compared to standard Python iterative loops?",
      expectedKeywords: ["contiguous", "c", "memory", "simd", "vectorization", "cache", "gil", "type"],
      followUps: [
        "How does data broadcasting in NumPy handle arithmetic between arrays of differing dimensions?",
        "What is the difference between a shallow view and a deep copy of a NumPy array?"
      ],
      idealAnswerSummary: "NumPy arrays are stored in contiguous C-style memory blocks with uniform datatypes, allowing compiled vector SIMD CPU instructions and bypassing Python's dynamic type-checking overhead."
    },
    {
      id: "viva-ds-2",
      moduleCode: "1.2",
      topic: "Data Imputation & Statistical Robustness",
      question: "When cleaning tabular data with severe outliers, compare the statistical implications of mean imputation versus median or KNN imputation.",
      expectedKeywords: ["outlier", "median", "mean", "skew", "robust", "variance", "distribution", "imputation"],
      followUps: [
        "What risk does forward-fill (ffill) introduce when applied to non-temporal cross-sectional datasets?",
        "How do you evaluate whether missing values are Missing Completely at Random (MCAR) versus Missing at Random (MAR)?"
      ],
      idealAnswerSummary: "The mean is distorted by extreme tail values, skewing imputed values. The median provides a robust 50th-percentile anchor, while KNN retains multivariate correlations between features."
    }
  ]
};

/**
 * Evaluate a student's answer in the Viva.
 * Evaluates:
 * - Keyword coverage & technical vocabulary
 * - Argument length and completeness
 * - Analytical clarity
 */
export function evaluateVivaResponse(question, studentAnswer) {
  if (!studentAnswer || studentAnswer.trim().length < 8) {
    return {
      score: 30,
      grade: 'Needs Elaboration',
      feedback: 'The answer is too brief. Please explain the technical rationale, underlying mechanisms, and real-world implications.',
      matchedKeywords: [],
      needsFollowUp: true,
      followUpPrompt: question.followUps?.[0] || 'Can you elaborate on the practical implementation details?'
    };
  }

  const normalizedAnswer = studentAnswer.toLowerCase();
  const matched = question.expectedKeywords.filter(kw => normalizedAnswer.includes(kw.toLowerCase()));
  const coverageRatio = matched.length / Math.max(1, question.expectedKeywords.length);

  // Score computation
  let baseScore = Math.min(100, Math.round(coverageRatio * 70 + (studentAnswer.length > 120 ? 30 : studentAnswer.length / 4)));
  if (baseScore < 45) baseScore = 55; // encouraging floor for effort

  let grade = 'Distinction';
  let feedback = '';

  if (baseScore >= 85) {
    grade = 'High Distinction';
    feedback = `Outstanding technical explanation! You clearly demonstrated a grasp of key concepts (${matched.slice(0, 4).join(', ')}).`;
  } else if (baseScore >= 70) {
    grade = 'Proficient';
    feedback = `Solid answer. You referenced core mechanisms (${matched.join(', ')}). For full distinction, consider discussing edge cases or performance tradeoffs.`;
  } else {
    grade = 'Competent with Gaps';
    feedback = `Good attempt, but key concepts like ${question.expectedKeywords.slice(0, 3).join(', ')} were missing. Review the reference module notes.`;
  }

  const needsFollowUp = baseScore < 80 && Array.isArray(question.followUps) && question.followUps.length > 0;

  return {
    score: baseScore,
    grade,
    feedback,
    matchedKeywords: matched,
    needsFollowUp,
    followUpPrompt: needsFollowUp ? question.followUps[0] : null
  };
}

/**
 * Socratic AI Mentor dialogue response generator.
 * Answers student questions by guiding them with hints and structured breakdowns.
 */
export function getSocraticMentorReply({ userQuery, currentModule, currentLesson, courseTitle }) {
  const query = (userQuery || '').toLowerCase();
  const modCode = currentModule?.code || '1.1';
  const modTitle = currentModule?.title || 'Fundamentals';

  // 1. Hint requests
  if (query.includes('hint') || query.includes('clue') || query.includes('stuck')) {
    return {
      type: 'hint',
      reply: `💡 **Socratic Hint for Module ${modCode} (${modTitle}):**\n\nBefore looking at the full solution, ask yourself:\n1. What is the single primary responsibility of this component or function?\n2. Are you handling the error or edge condition (e.g. empty array, missing data, or unhandled rejection)?\n\n*Check the verified sample solution in the player to inspect the exact reference syntax!*`
    };
  }

  // 2. Code explanation or debugging
  if (query.includes('debug') || query.includes('error') || query.includes('why does') || query.includes('fix')) {
    return {
      type: 'debug',
      reply: `🔍 **Code Debugging Guide for Module ${modCode}:**\n\nIn ${courseTitle}, runtime errors typically stem from:\n- **State Inconsistencies:** Mutating state directly instead of using functional setters.\n- **Async Race Conditions:** Calling async operations without awaiting promises or ignoring network abort cleanup.\n- **Null References:** Accessing properties like \`obj.property\` when \`obj\` is still loading.\n\n*Try running your code in the Live Code Sandbox tab to isolate the failing line!*`
    };
  }

  // 3. Viva preparation
  if (query.includes('viva') || query.includes('interview') || query.includes('test me')) {
    return {
      type: 'viva_prep',
      reply: `🎙️ **AI Viva Preparation Checkpoint:**\n\nLet's test you on Module ${modCode}!\n\n**Question:** *How does your implementation handle scale and asynchronous events? What would fail if the backend latency spikes to 5 seconds?*\n\nTake 30 seconds to formulate your answer, then jump into the **AI Viva Voce** tab to test your spoken delivery with voice synthesis!`
    };
  }

  // 4. Default pedagogical Socratic guidance
  return {
    type: 'socratic',
    reply: `👋 **LearnSphere Mentor here for Module ${modCode}: ${modTitle}!**\n\nRegarding your question: *"${userQuery}"*\n\nIn modern architecture, we address this by following separation of concerns. Consider:\n- What inputs does this section require?\n- How does the system inform the user while the process is running?\n\nWould you like me to walk you through a conceptual breakdown, or would you like to run a quick test in the **Live Sandbox**?`
  };
}
