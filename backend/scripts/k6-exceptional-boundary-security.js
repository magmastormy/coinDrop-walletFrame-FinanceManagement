import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend, Rate } from 'k6/metrics';

export let options = {
  stages: [
    { duration: '10s', target: 2 },
    { duration: '20s', target: 5 },
    { duration: '20s', target: 5 },
    { duration: '10s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000'],
    'checks': ['rate>0.8'],
  },
};

let errorRate = new Rate('error_rate');
let latencyTrend = new Trend('endpoint_latency');

export default function () {
  // Login with invalid credentials
  group('Login - Invalid Credentials', function () {
    const loginPayload = JSON.stringify({
      email: `invalid${__VU}@test.com`,
      password: 'WrongPassword!'
    });
    const res = http.post('http://localhost:5001/api/auth/login', loginPayload, {
      headers: { 'Content-Type': 'application/json' },
    });
    latencyTrend.add(res.timings.duration);
    console.log(`[Login Invalid] Status: ${res.status}, Body: ${res.body}`);
    check(res, {
      'login returns 401': (r) => r.status === 401,
      'error message present': (r) => r.body && r.body.includes('Wrong email or password')
    });
    errorRate.add(res.status !== 401);
  });

  // Registration with weak password
  group('Registration - Weak Password', function () {
    const regPayload = JSON.stringify({
      username: `weakuser${__VU}`,
      email: `weakuser${__VU}@test.com`,
      password: 'weak',
      firstName: 'Test',
      lastName: 'User',
      phone: '+1234567890'
    });
    const res = http.post('http://localhost:5001/api/auth/register', regPayload, {
      headers: { 'Content-Type': 'application/json' },
    });
    latencyTrend.add(res.timings.duration);
    console.log(`[Register Weak] Status: ${res.status}, Body: ${res.body}`);
    check(res, {
      'registration returns 422/400': (r) => r.status === 422 || r.status === 400,
      'validation error': (r) => r.body && r.body.includes('Password')
    });
    errorRate.add(res.status !== 400 && res.status !== 422);
  });

  // Access protected endpoint with invalid token
  group('Protected Endpoint - Invalid Token', function () {
    const res = http.get('http://localhost:5001/api/profile', {
      headers: { 'Authorization': 'Bearer invalidtoken' },
    });
    latencyTrend.add(res.timings.duration);
    console.log(`[Profile Invalid Token] Status: ${res.status}, Body: ${res.body}`);
    check(res, {
      'returns 401': (r) => r.status === 401,
      'error message present': (r) => r.body && r.body.includes('Invalid token')
    });
    errorRate.add(res.status !== 401);
  });

  // Fuzzing - Malformed JSON
  group('Fuzzing - Malformed JSON', function () {
    const url = 'http://localhost:5001/api/auth/register';
    const params = { headers: { 'Content-Type': 'application/json' } };
    const badBody = '{ username: "fuzz", email: "fuzz@test.com", password: }';
    const res = http.post(url, badBody, params);
    latencyTrend.add(res.timings.duration);
    console.log(`[Fuzzing Malformed JSON] Status: ${res.status}, Body: ${res.body}`);
    check(res, {
      'returns 400/422/500': (r) => [400, 422, 500].includes(r.status),
    });
    errorRate.add(![400, 422, 500].includes(res.status));
  });

  // Registration with max field lengths (boundary)
  group('Registration - Max Field Lengths', function () {
    const regPayload = JSON.stringify({
      username: 'a'.repeat(21), // Exceeds max
      email: `maxuser${__VU}@test.com`,
      password: 'Test1234!',
      firstName: 'A'.repeat(51),
      lastName: 'B'.repeat(51),
      phone: '+1234567890'
    });
    const res = http.post('http://localhost:5001/api/auth/register', regPayload, {
      headers: { 'Content-Type': 'application/json' },
    });
    latencyTrend.add(res.timings.duration);
    console.log(`[Register Max Length] Status: ${res.status}, Body: ${res.body}`);
    check(res, {
      'registration returns 400/422': (r) => r.status === 400 || r.status === 422,
      'validation error': (r) => r.body && (r.body.includes('Username') || r.body.includes('First name') || r.body.includes('Last name'))
    });
    errorRate.add(res.status !== 400 && res.status !== 422);
  });

  // Login with empty fields (boundary)
  group('Login - Empty Fields', function () {
    const loginPayload = JSON.stringify({ email: '', password: '' });
    const res = http.post('http://localhost:5001/api/auth/login', loginPayload, {
      headers: { 'Content-Type': 'application/json' },
    });
    latencyTrend.add(res.timings.duration);
    console.log(`[Login Empty Fields] Status: ${res.status}, Body: ${res.body}`);
    check(res, {
      'login returns 400/422': (r) => r.status === 400 || r.status === 422,
      'validation error': (r) => r.body && r.body.includes('Password')
    });
    errorRate.add(res.status !== 400 && res.status !== 422);
  });

  // Try to access a non-existent endpoint (404)
  group('Non-existent Endpoint', function () {
    const res = http.get('http://localhost:5001/api/doesnotexist');
    latencyTrend.add(res.timings.duration);
    console.log(`[404 Test] Status: ${res.status}, Body: ${res.body}`);
    check(res, {
      'returns 404': (r) => r.status === 404,
    });
    errorRate.add(res.status !== 404);
  });

  sleep(1);
}
