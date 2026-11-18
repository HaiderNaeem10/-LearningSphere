// netlify/functions/_rateLimiter.js
// Simple rate‑limiter that stores counters in Supabase.
// Each request provides the client IP (via event.headers['x-forwarded-for'] or event.headers['client-ip']).
// It enforces a maximum number of calls per endpoint within a time window.

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

/**
 * Checks the rate limit for a given IP + endpoint.
 * @param {string} ip - Client IP address.
 * @param {string} endpoint - Logical name of the endpoint (e.g., 'login', 'register').
 * @returns {Promise<{allowed: boolean, remaining: number, reset: number, message?: string}>}
 */
async function checkRateLimit(ip, endpoint) {
  const max = parseInt(process.env.RATE_LIMIT_MAX || '10', 10); // default 10 requests
  const windowSec = parseInt(process.env.RATE_LIMIT_WINDOW || '60', 10); // default 60 seconds

  // Try to fetch existing record for this IP/endpoint
  const { data, error } = await supabase
    .from('rate_limits')
    .select('id, count, window_start')
    .eq('ip', ip)
    .eq('endpoint', endpoint)
    .single();

  const now = new Date();
  const windowStart = new Date(now.getTime() - windowSec * 1000);

  if (error && error.code !== 'PGRST116') {
    // Unexpected error – allow request but log
    console.error('Rate‑limiter fetch error:', error);
    return { allowed: true, remaining: max, reset: windowSec };
  }

  if (!data) {
    // No record yet – create one
    await supabase.from('rate_limits').insert({
      ip,
      endpoint,
      count: 1,
      window_start: now.toISOString()
    });
    return { allowed: true, remaining: max - 1, reset: windowSec };
  }

  // Existing record – check if window has passed
  const recordStart = new Date(data.window_start);
  if (recordStart < windowStart) {
    // Window reset – start over
    const { error: updErr } = await supabase
      .from('rate_limits')
      .update({ count: 1, window_start: now.toISOString() })
      .eq('id', data.id);
    if (updErr) console.error('Rate‑limiter reset error:', updErr);
    return { allowed: true, remaining: max - 1, reset: windowSec };
  }

  // Within current window
  if (data.count >= max) {
    const resetIn = Math.ceil((recordStart.getTime() + windowSec * 1000 - now.getTime()) / 1000);
    return { allowed: false, remaining: 0, reset: resetIn, message: 'Rate limit exceeded' };
  }

  // Increment counter
  const { error: incErr } = await supabase
    .from('rate_limits')
    .update({ count: data.count + 1 })
    .eq('id', data.id);
  if (incErr) console.error('Rate‑limiter increment error:', incErr);

  return { allowed: true, remaining: max - data.count - 1, reset: Math.ceil((recordStart.getTime() + windowSec * 1000 - now.getTime()) / 1000) };
}

module.exports = { checkRateLimit };
