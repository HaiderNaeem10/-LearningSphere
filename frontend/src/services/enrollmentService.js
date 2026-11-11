// File: src/services/enrollmentService.js
import { supabase } from './supabaseClient';
import { startModule, completeModule, unlockNextModule } from './moduleService';

/**
 * Enroll a student in a course.
 *   - Inserts a row into `enrollments`.
 *   - Creates a `module_progress` entry for the first module (order = 1) and unlocks it.
 */
export const enrollInCourse = async (studentId, courseId, assignedBy = null) => {
  // 1️⃣ Insert enrollment
  const { data: enrollment, error: enrollErr } = await supabase
    .from('enrollments')
    .insert({ student_id: studentId, course_id: courseId, assigned_by: assignedBy })
    .single();
  if (enrollErr) throw enrollErr;

  // 2️⃣ Find the first module for the course (order = 1)
  const { data: firstModule, error: modErr } = await supabase
    .from('modules')
    .select('id, "order"')
    .eq('course_id', courseId)
    .eq('order', 1)
    .single();
  if (modErr) throw modErr;

  // 3️⃣ Create module_progress for the first module (started = false, unlocked = false already)
  await startModule(studentId, firstModule.id);

  // 4️⃣ Unlock the first module (set locked = false)
  await supabase
    .from('modules')
    .update({ locked: false })
    .eq('id', firstModule.id);

  return enrollment;
};
