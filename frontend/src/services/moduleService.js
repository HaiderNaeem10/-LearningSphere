import { supabase } from './supabaseClient';

/**
 * Fetch modules for a given course, ordered by the `order` column.
 * Returns an array of module objects with fields:
 *   id, title, description, sample_solution, locked, order, code
 */
export const getModules = async (courseId) => {
  const { data, error } = await supabase
    .from('modules')
    .select('*')
    .eq('course_id', courseId)
    .order('order', { ascending: true });
  if (error) throw error;
  return data;
};

/**
 * Mark a module as started for a student – creates a module_progress row.
 */
export const startModule = async (studentId, moduleId) => {
  const { data, error } = await supabase
    .from('module_progress')
    .insert({ student_id: studentId, module_id: moduleId, completed: false });
  if (error) throw error;
  return data;
};

/**
 * Mark a module as completed for a student – updates the module_progress row.
 */
export const completeModule = async (studentId, moduleId) => {
  const { data, error } = await supabase
    .from('module_progress')
    .update({ completed: true, completed_at: new Date().toISOString() })
    .eq('student_id', studentId)
    .eq('module_id', moduleId);
  if (error) throw error;
  return data;
};

/**
 * Unlock the next module for a student after the current one is completed.
 */
export const unlockNextModule = async (courseId, currentOrder) => {
  // Find the next module (order = currentOrder + 1)
  const { data: nextModules, error } = await supabase
    .from('modules')
    .select('id')
    .eq('course_id', courseId)
    .eq('order', currentOrder + 1)
    .single();
  if (error) return; // no next module
  // Unlock it – set locked = false
  await supabase
    .from('modules')
    .update({ locked: false })
    .eq('id', nextModules.id);
};
