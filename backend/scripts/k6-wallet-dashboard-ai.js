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
  // Group: Simulate rapid wallet creation and deletion
  group('Wallet Creation/Deletion', function () {
    // Create wallet
    const walletPayload = JSON.stringify({
      name: `TestWallet${__VU}_${__ITER}`,
      balance: Math.floor(Math.random() * 1000) + 1,
      currency: 'USD',
    });
    const createRes = http.post('http://localhost:5001/api/wallets', walletPayload, {
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer {{VALID_TOKEN}}' },
    });
    latencyTrend.add(createRes.timings.duration);
    console.log(`[Wallet Create] Status: ${createRes.status}, Body: ${createRes.body}`);
    check(createRes, {
      'wallet created': (r) => r.status === 201,
    });
    errorRate.add(createRes.status !== 201);

    // Extract wallet ID if created
    let walletId = '';
    try {
      walletId = JSON.parse(createRes.body)._id;
    } catch (e) {}

    // Delete wallet if created
    if (walletId) {
      const delRes = http.del(`http://localhost:5001/api/wallets/${walletId}`, null, {
        headers: { 'Authorization': 'Bearer {{VALID_TOKEN}}' },
      });
      latencyTrend.add(delRes.timings.duration);
      console.log(`[Wallet Delete] Status: ${delRes.status}, Body: ${delRes.body}`);
      check(delRes, {
        'wallet deleted': (r) => r.status === 200 || r.status === 204,
      });
      errorRate.add(delRes.status !== 200 && delRes.status !== 204);
    }
  });

  // Group: Test dashboard analytics endpoint with/without filters
  group('Dashboard Analytics', function () {
    // No filters
    const res1 = http.get('http://localhost:5001/api/analytics/dashboard', {
      headers: { 'Authorization': 'Bearer {{VALID_TOKEN}}' },
    });
    latencyTrend.add(res1.timings.duration);
    console.log(`[Dashboard No Filter] Status: ${res1.status}`);
    check(res1, {
      'dashboard returns 200': (r) => r.status === 200,
    });
    errorRate.add(res1.status !== 200);

    // With date filter
    const res2 = http.get('http://localhost:5001/api/analytics/dashboard?from=2024-01-01&to=2024-12-31', {
      headers: { 'Authorization': 'Bearer {{VALID_TOKEN}}' },
    });
    latencyTrend.add(res2.timings.duration);
    console.log(`[Dashboard Date Filter] Status: ${res2.status}`);
    check(res2, {
      'dashboard with filter returns 200': (r) => r.status === 200,
    });
    errorRate.add(res2.status !== 200);
  });

  // Group: Test AI chat endpoint with valid/invalid payloads
  group('AI Chat Endpoint', function () {
    // Valid prompt
    const validPayload = JSON.stringify({ prompt: 'How do I save more money?' });
    const validRes = http.post('http://localhost:5001/api/ai/chat', validPayload, {
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer {{VALID_TOKEN}}' },
    });
    latencyTrend.add(validRes.timings.duration);
    console.log(`[AI Chat Valid] Status: ${validRes.status}`);
    check(validRes, {
      'AI chat returns 200': (r) => r.status === 200,
    });
    errorRate.add(validRes.status !== 200);

    // Invalid (empty) prompt
    const invalidPayload = JSON.stringify({ prompt: '' });
    const invalidRes = http.post('http://localhost:5001/api/ai/chat', invalidPayload, {
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer {{VALID_TOKEN}}' },
    });
    latencyTrend.add(invalidRes.timings.duration);
    console.log(`[AI Chat Invalid] Status: ${invalidRes.status}, Body: ${invalidRes.body}`);
    check(invalidRes, {
      'AI chat returns 400/422': (r) => r.status === 400 || r.status === 422,
    });
    errorRate.add(invalidRes.status !== 400 && invalidRes.status !== 422);
  });

  sleep(1);
}
