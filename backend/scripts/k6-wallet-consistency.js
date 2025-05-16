import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend, Rate } from 'k6/metrics';

export let options = {
  vus: 10, // Number of concurrent users (simulated users)
  iterations: 10, // Each VU will run this many iterations (total 100 requests)
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    'checks': ['rate>0.95'],
  },
};

let errorRate = new Rate('error_rate');
let latencyTrend = new Trend('endpoint_latency');

// We'll populate this array in the setup function
const USERS = [];

// Setup function to create test users and wallets
export function setup() {
  console.log('Setting up test users and wallets...');
  
  // Create 5 test users
  for (let i = 1; i <= 5; i++) {
    const timestamp = new Date().getTime();
    const email = `wallet_test_user${i}_${timestamp}@test.com`;
    const password = 'Test1234!';
    
    // Register user
    const regPayload = JSON.stringify({
      username: `wallet_test_user${i}${Math.floor(Math.random() * 1000)}`,
      email: email,
      password: password,
      firstName: 'Test',
      lastName: 'User',
      phone: '+1234567890'
    });
    
    const regRes = http.post('http://localhost:5001/api/auth/register', regPayload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    });
    
    if (regRes.status === 201 || regRes.status === 200) {
      // Login to get token
      const loginPayload = JSON.stringify({
        email: email,
        password: password
      });
      
      const loginRes = http.post('http://localhost:5001/api/auth/login', loginPayload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      });
      
      if (loginRes.status === 200) {
        try {
          const loginData = JSON.parse(loginRes.body);
          let token = null;
          
          // Try different token field names
          if (loginData.token) {
            token = loginData.token;
          } else if (loginData.accessToken) {
            token = loginData.accessToken;
          } else if (loginData.access_token) {
            token = loginData.access_token;
          } else if (loginData.data && loginData.data.token) {
            token = loginData.data.token;
          }
          
          if (token) {
            // Create wallet for this user
            const walletPayload = JSON.stringify({
              name: `Test Wallet ${i}`,
              type: 'cash',
              balance: 1000, // Start with 1000 units
              currency: 'USD'
            });
            
            const walletRes = http.post('http://localhost:5001/api/wallets', walletPayload, {
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              timeout: 10000
            });
            
            if (walletRes.status === 201 || walletRes.status === 200) {
              try {
                const walletData = JSON.parse(walletRes.body);
                let walletId = null;
                
                if (walletData._id) {
                  walletId = walletData._id;
                } else if (walletData.id) {
                  walletId = walletData.id;
                }
                
                if (walletId) {
                  // Add user to our test array
                  USERS.push({
                    token: token,
                    walletId: walletId,
                    email: email
                  });
                  console.log(`Created test user ${i} with wallet ID: ${walletId}`);
                }
              } catch (e) {
                console.log(`Failed to parse wallet response: ${e.message}`);
              }
            } else {
              console.log(`Failed to create wallet for user ${i}. Status: ${walletRes.status}`);
            }
          }
        } catch (e) {
          console.log(`Failed to parse login response: ${e.message}`);
        }
      } else {
        console.log(`Failed to login as user ${i}. Status: ${loginRes.status}`);
      }
    } else {
      console.log(`Failed to register user ${i}. Status: ${regRes.status}`);
    }
    
    // Wait between user creations to avoid rate limiting
    sleep(1);
  }
  
  console.log(`Setup complete. Created ${USERS.length} test users with wallets.`);
  return { USERS };
}

export default function () {
  // Pick a random user for this iteration
  const user = USERS[Math.floor(Math.random() * USERS.length)];
  if (!user) {
    console.error('No test users available. Check if setup function completed successfully.');
    return;
  }
  
  group('Concurrent Wallet Updates', function () {
    // Simulate a withdrawal of 10 units
    const payload = JSON.stringify({ amount: -10 });
    const url = `http://localhost:5001/api/wallets/${user.walletId}/balance`;
    
    const res = http.put(url, payload, {
      headers: { 
        'Content-Type': 'application/json', 
        'Authorization': `Bearer ${user.token}`
      },
      timeout: 5000
    });
    
    latencyTrend.add(res.timings.duration);
    
    // Proper JSON response checking
    check(res, {
      'update returns 200': (r) => r.status === 200,
      'response is valid JSON': (r) => {
        try {
          JSON.parse(r.body);
          return true;
        } catch (e) {
          console.log(`Invalid JSON response: ${e.message}`);
          return false;
        }
      },
      'balance field is present': (r) => {
        try {
          const data = JSON.parse(r.body);
          return data.balance !== undefined;
        } catch (e) {
          return false;
        }
      }
    });
    
    errorRate.add(res.status !== 200);
    
    // Log the result for debugging
    if (res.status === 200) {
      try {
        const data = JSON.parse(res.body);
        console.log(`Updated wallet ${user.walletId} balance: ${data.balance}`);
      } catch (e) {
        console.log(`Could not parse response: ${e.message}`);
      }
    } else {
      console.log(`Failed to update wallet. Status: ${res.status}, Response: ${res.body}`);
    }
  });
  
  // Add a small sleep to simulate real-world usage patterns
  sleep(0.1);
}

// After running:
// - Check each wallet's final balance. The total withdrawn should be 10 * vus * iterations per wallet.
// - All balances should match the expected result, with no lost or duplicate updates.
