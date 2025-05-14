import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '30s', target: 5 }, // ramp up to 5 users
    { duration: '1m', target: 5 },   // stay at 5 users
    { duration: '30s', target: 0 },  // ramp down
  ],
};

export default function () {
  // Health check
  http.get('http://localhost:5001/api/health');

  // Registration (valid payload)
  const regPayload = JSON.stringify({
    username: `user${__VU}`,
    email: `user${__VU}@test.com`,
    password: 'Test1234!',
    firstName: 'Test',
    lastName: 'User',
    phone: '+1234567890'
  });
  const regRes = http.post('http://localhost:5001/api/auth/register', regPayload, {
    headers: { 'Content-Type': 'application/json' },
  });

  // Extract userId from registration response
  let userId = '';
  if (regRes && regRes.json && regRes.json('user') && regRes.json('user').id) {
    userId = regRes.json('user').id;
  }

  // Login (valid payload)
  const loginPayload = JSON.stringify({
    email: `user${__VU}@test.com`,
    password: 'Test1234!'
  });
  const loginRes = http.post('http://localhost:5001/api/auth/login', loginPayload, {
    headers: { 'Content-Type': 'application/json' },
  });
  let token = '';
  if (loginRes && loginRes.json && loginRes.json('token')) {
    token = loginRes.json('token');
  } else if (loginRes && loginRes.json && loginRes.json('accessToken')) {
    token = loginRes.json('accessToken');
  }

  // Only call AI endpoint if we have a token and userId
  if (token && userId) {
    const aiPayload = JSON.stringify({
      messages: [{ role: 'user', content: 'Test AI prompt' }],
      userId: userId
    });
    http.post('http://localhost:5001/api/zhipuai/send', aiPayload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });
  }

  sleep(1);
}
