// netlify/functions/register.js
// Netlify Function that mimics the old PHP register endpoint.
// Stores the user in Supabase and returns a success message.

const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const { checkRateLimit } = require('./_rateLimiter');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ message: 'Method not allowed' }) };
  }

  // ---- Rate limiting ---------------------------------------------------
  const ip = event.headers['x-forwarded-for'] || event.headers['client-ip'] || 'unknown';
  const rl = await checkRateLimit(ip, 'register');
  if (!rl.allowed) {
    return { statusCode: 429, body: JSON.stringify({ message: rl.message || 'Too many requests' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ message: 'Invalid JSON' }) };
  }

  const { name, email, password, role } = body;
  if (!name || !email || !password || !role) {
    return { statusCode: 400, body: JSON.stringify({ message: 'Missing fields' }) };
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { statusCode: 400, body: JSON.stringify({ message: 'Invalid email format.' }) };
  }

  // Check if user already exists
  const { data: existing } = await supabase.from('users').select('id').eq('email', email).single();
  if (existing) {
    return { statusCode: 400, body: JSON.stringify({ message: 'Email already in use.' }) };
  }

  // Hash password
  const password_hash = await bcrypt.hash(password, 10);

  // Insert new user (auto‑approve for demo)
  const { data, error } = await supabase.from('users').insert({
    name,
    email,
    password_hash,
    role,
    is_approved: 1,
  }).single();

  if (error) {
    console.error('Supabase insert error:', error);
    return { statusCode: 503, body: JSON.stringify({ message: 'Unable to register user.' }) };
  }

  return {
    statusCode: 201,
    body: JSON.stringify({ message: 'User registered successfully.' }),
  };
};
