// netlify/functions/login.js
// Netlify Function that mimics the old PHP login endpoint.
// It uses Supabase as the data store and returns a JWT token.

const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Supabase client – values come from Netlify environment variables.
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// netlify/functions/login.js
// Netlify Function that mimics the old PHP login endpoint.
// It uses Supabase as the data store and returns a JWT token.

const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { checkRateLimit } = require('./_rateLimiter');

// Supabase client – values come from Netlify environment variables.
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
  const rl = await checkRateLimit(ip, 'login');
  if (!rl.allowed) {
    return { statusCode: 429, body: JSON.stringify({ message: rl.message || 'Too many requests' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ message: 'Invalid JSON' }) };
  }

  const { email, password } = body;
  if (!email || !password) {
    return { statusCode: 400, body: JSON.stringify({ message: 'Missing email or password' }) };
  }

  // 1️⃣ Fetch the user row from Supabase
  const { data: user, error } = await supabase
    .from('users')
    .select('id, name, email, password_hash, role, is_approved')
    .eq('email', email)
    .single();

  if (error || !user) {
    return { statusCode: 401, body: JSON.stringify({ message: 'Invalid email or password.' }) };
  }

  // 2️⃣ Verify password hash (bcrypt)
  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) {
    return { statusCode: 401, body: JSON.stringify({ message: 'Invalid email or password.' }) };
  }

  // 3️⃣ Check approval flag
  if (user.is_approved == 0) {
    return { statusCode: 403, body: JSON.stringify({ message: 'Account not approved yet.' }) };
  }

  // 4️⃣ Issue JWT (use the same secret you used in JwtHandler.php)
  const payload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Login successful.',
      token,
      user: payload,
    }),
  };
};
 {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ message: 'Method not allowed' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ message: 'Invalid JSON' }) };
  }

  const { email, password } = body;
  if (!email || !password) {
    return { statusCode: 400, body: JSON.stringify({ message: 'Missing email or password' }) };
  }

  // 1️⃣ Fetch the user row from Supabase
  const { data: user, error } = await supabase
    .from('users')
    .select('id, name, email, password_hash, role, is_approved')
    .eq('email', email)
    .single();

  if (error || !user) {
    return { statusCode: 401, body: JSON.stringify({ message: 'Invalid email or password.' }) };
  }

  // 2️⃣ Verify password hash (bcrypt)
  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) {
    return { statusCode: 401, body: JSON.stringify({ message: 'Invalid email or password.' }) };
  }

  // 3️⃣ Check approval flag
  if (user.is_approved == 0) {
    return { statusCode: 403, body: JSON.stringify({ message: 'Account not approved yet.' }) };
  }

  // 4️⃣ Issue JWT (use the same secret you used in JwtHandler.php)
  const payload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Login successful.',
      token,
      user: payload,
    }),
  };
};
