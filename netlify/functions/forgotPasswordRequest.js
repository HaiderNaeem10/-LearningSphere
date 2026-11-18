// netlify/functions/forgotPasswordRequest.js
// Endpoint to request a password reset. It generates a one‑time token, stores it in Supabase,
// and (optionally) sends an email to the user. For now we just return the token in the response.

const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
const { checkRateLimit } = require('./_rateLimiter');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ message: 'Method not allowed' }) };
  }

  // Rate limiting for this endpoint
  const ip = event.headers['x-forwarded-for'] || event.headers['client-ip'] || 'unknown';
  const rl = await checkRateLimit(ip, 'forgotPassword');
  if (!rl.allowed) {
    return { statusCode: 429, body: JSON.stringify({ message: rl.message || 'Too many requests' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ message: 'Invalid JSON' }) };
  }

  const { email } = body;
  if (!email) {
    return { statusCode: 400, body: JSON.stringify({ message: 'Email is required' }) };
  }

  // Verify that the email exists in the users table
  const { data: user, error: userErr } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single();
  if (userErr || !user) {
    // For security, do not reveal whether the email exists
    return { statusCode: 200, body: JSON.stringify({ message: 'If the email exists, a reset link has been sent.' }) };
  }

  // Generate a secure random token (32 hex characters → 128‑bit)
  const token = crypto.randomBytes(16).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiry

  // Store token in a dedicated table
  const { error: insertErr } = await supabase.from('password_resets').insert({
    user_id: user.id,
    email,
    token,
    expires_at: expiresAt.toISOString()
  });

  if (insertErr) {
    console.error('Insert reset token error:', insertErr);
    return { statusCode: 500, body: JSON.stringify({ message: 'Could not generate reset token' }) };
  }

  // TODO: integrate with an email provider (SendGrid, Mailgun, etc.) using env vars.
  // For now we just return the token for debugging purposes.
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'If the email exists, a reset link has been sent.',
      token // <-- remove in production
    })
  };
};
