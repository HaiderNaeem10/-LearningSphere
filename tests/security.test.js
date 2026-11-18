const axios = require('axios');
const BASE = process.env.API_URL || 'http://localhost:5173'; // dev front-end proxy

// Helper to pause
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

(async () => {
  try {
    console.log('--- Security Test Suite ---');

    // 1️⃣ Register a test student user
    const testEmail = `test_student_${Date.now()}@example.com`;
    const testPassword = 'TestPass123!';
    console.log('Registering test user...');
    await axios.post(`${BASE}/api/auth/register.php`, {
      name: 'Test Student',
      email: testEmail,
      password: testPassword,
      role: 'student'
    });
    console.log('✅ Registered');

    // 2️⃣ Login to obtain JWT
    console.log('Logging in...');
    const loginRes = await axios.post(`${BASE}/api/auth/login.php`, {
      email: testEmail,
      password: testPassword
    });
    const token = loginRes.data.token;
    if (!token) throw new Error('No token returned');
    console.log('✅ Logged in, token acquired');

    // 3️⃣ Access a protected student endpoint (e.g., quiz submit) – should succeed
    console.log('Testing authorized access (student)...');
    const quizPayload = {
      quiz_id: 1,
      student_id: loginRes.data.user.id,
      answers: []
    };
    const submitRes = await axios.post(`${BASE}/api/quizzes/submit.php`, quizPayload, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Student access OK, status', submitRes.status);

    // 4️⃣ Attempt instructor‑only endpoint – should get 403
    console.log('Testing forbidden role (student accessing instructor endpoint)...');
    try {
      await axios.get(`${BASE}/api/instructor/some-protected.php`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.error('❌ Expected 403 but got success');
    } catch (e) {
      if (e.response && e.response.status === 403) {
        console.log('✅ Correctly blocked with 403');
      } else {
        console.error('❌ Unexpected error', e.message);
      }
    }

    // 5️⃣ Call protected endpoint without token – expect 401
    console.log('Testing missing token...');
    try {
      await axios.get(`${BASE}/api/quizzes/submit.php`);
      console.error('❌ Expected 401 but got success');
    } catch (e) {
      if (e.response && e.response.status === 401) {
        console.log('✅ Correctly blocked with 401');
      } else {
        console.error('❌ Unexpected error', e.message);
      }
    }

    // 6️⃣ Rate‑limit test – send 65 rapid requests (limit is 60/min)
    console.log('Testing rate limiting (65 rapid requests)...');
    let limitExceeded = false;
    for (let i = 0; i < 65; i++) {
      try {
        await axios.post(`${BASE}/api/quizzes/submit.php`, quizPayload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (e) {
        if (e.response && e.response.status === 429) {
          limitExceeded = true;
          console.log('✅ Rate limit triggered at request', i + 1);
          break;
        }
      }
    }
    if (!limitExceeded) console.warn('⚠️ Rate limit not triggered – adjust limits or test timing');

    console.log('--- Test suite finished ---');
  } catch (err) {
    console.error('Test suite failed:', err.message);
    process.exit(1);
  }
})();
