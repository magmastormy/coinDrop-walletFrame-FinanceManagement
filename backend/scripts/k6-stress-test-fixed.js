import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend, Rate } from 'k6/metrics';

export let options = {
  // Use shorter stages to limit the total number of iterations
  stages: [
    { duration: '10s', target: 10 },  // ramp up to 10 users
    { duration: '20s', target: 15 },  // ramp up to 15 users
    { duration: '20s', target: 10 },  // stay at 10 users
    { duration: '10s', target: 0 },   // ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<5000'], // 95% of requests should complete within 5s
    'http_req_duration{name:AI Chat}': ['p(95)<30000'], // AI requests can take longer
    'checks{name:registration status 201/200}': ['rate>0.5'], // 50% of registrations should succeed
  },
  // Add a setup function to pre-create test users
  setupTimeout: '30s',
  // Batch requests to avoid overwhelming the server
  batchPerHost: 2,
};

// Create a shared array to store pre-created user credentials
const sharedUsers = [];

// Define metrics to track performance
let loginTrend = new Trend('login_duration');
let aiTrend = new Trend('ai_duration');
let regTrend = new Trend('registration_duration');
let profileTrend = new Trend('profile_duration');
let dashboardTrend = new Trend('dashboard_duration');
let successRate = new Rate('success_rate');

// Setup function to pre-create some test users
export function setup() {
  // Create 5 test users that can be reused
  const baseTimestamp = new Date().getTime();
  
  for (let i = 1; i <= 5; i++) {
    const userTimestamp = baseTimestamp + i;
    const email = `preuser${i}_${userTimestamp}@test.com`;
    const password = 'Test1234!';
    
    // Register the user
    const regPayload = JSON.stringify({
      username: `user${i}${Math.floor(Math.random() * 1000)}`,
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
      try {
        const responseBody = JSON.parse(regRes.body);
        let userId = null;
        
        if (responseBody.user && responseBody.user._id) {
          userId = responseBody.user._id;
        } else if (responseBody.user && responseBody.user.id) {
          userId = responseBody.user.id;
        } else if (responseBody._id) {
          userId = responseBody._id;
        } else if (responseBody.id) {
          userId = responseBody.id;
        }
        
        if (userId) {
          // Store the credentials for later use
          sharedUsers.push({
            email: email,
            password: password,
            userId: userId
          });
          console.log(`Pre-created user ${i} with email ${email}`);
        }
      } catch (e) {
        console.log(`Failed to parse registration response: ${e.message}`);
      }
    }
    
    // Wait a bit between registrations
    sleep(1);
  }
  
  console.log(`Setup complete. Created ${sharedUsers.length} test users.`);
  return { sharedUsers };
}

// Helper function to handle rate limiting with exponential backoff
function handleRateLimit(response, operation) {
  if (response.status === 429) {
    // Rate limited - log and wait
    console.log(`Rate limited during ${operation}. Backing off...`);
    // Exponential backoff between 1-3 seconds
    const backoffTime = (Math.random() * 2) + 1;
    sleep(backoffTime);
    return true;
  }
  return false;
}

// Helper: create resource with retries
function createWithRetry(url, payload, token, label, maxRetries = 3) {
  let retries = 0;
  let delay = 1000;
  let res;
  while (retries < maxRetries) {
    res = http.post(url, payload, {
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      timeout: 10000
    });
    if (handleRateLimit(res, label)) {
      retries++;
      if (retries < maxRetries) {
        sleep(delay);
        delay *= 2; // Exponential backoff
        continue;
      }
      return null;
    }
    if (res.status === 201 || res.status === 200) {
      return res;
    }
    retries++;
    if (retries < maxRetries) {
      sleep(delay);
      delay *= 2; // Exponential backoff
    }
  }
  return null;
}

export default function () {
  // Use either a pre-created user or create a new one
  let userId = '';
  let token = '';
  let usePreCreatedUser = false;
  
  // Determine if we should use a pre-created user
  if (sharedUsers.length > 0) {
    // Use a pre-created user based on VU number (round-robin)
    const userIndex = (__VU - 1) % sharedUsers.length;
    const preCreatedUser = sharedUsers[userIndex];
    
    if (preCreatedUser) {
      usePreCreatedUser = true;
      userId = preCreatedUser.userId;
      
      // Login with pre-created user
      group('Login with Pre-created User', function () {
        const loginPayload = JSON.stringify({
          email: preCreatedUser.email,
          password: preCreatedUser.password
        });
        
        try {
          const loginRes = http.post('http://localhost:5001/api/auth/login', loginPayload, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 10000
          });
          
          loginTrend.add(loginRes.timings.duration);
          
          // Check if login was successful
          const success = loginRes.status === 200;
          check(loginRes, { 'login status 200': () => success });
          successRate.add(success);
          
          if (success) {
            try {
              const responseBody = JSON.parse(loginRes.body);
              
              // Try different token field names
              if (responseBody.token) {
                token = responseBody.token;
              } else if (responseBody.accessToken) {
                token = responseBody.accessToken;
              } else if (responseBody.access_token) {
                token = responseBody.access_token;
              } else if (responseBody.data && responseBody.data.token) {
                token = responseBody.data.token;
              }
              
              if (token) {
                console.log(`Login successful with pre-created user ${preCreatedUser.email}`);
              }
            } catch (e) {
              console.log(`Failed to parse login response: ${e.message}`);
            }
          }
        } catch (e) {
          console.log(`Login request failed: ${e.message}`);
        }
      });
    }
  }
  
  // If we couldn't use a pre-created user, create a new one
  if (!usePreCreatedUser) {
    // Registration
    group('User Registration', function () {
      // Add timestamp and random number to email to avoid duplicate registration errors
      const timestamp = new Date().getTime();
      const random = Math.floor(Math.random() * 10000);
      const regPayload = JSON.stringify({
        username: `user${__VU}${random % 1000}`,
        email: `user${__VU}_${timestamp}_${random}@test.com`,
        password: 'Test1234!',
        firstName: 'Test',
        lastName: 'User',
        phone: '+1234567890'
      });
      
      try {
        const regRes = http.post('http://localhost:5001/api/auth/register', regPayload, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000
        });
        
        regTrend.add(regRes.timings.duration);
        
        // Check if registration was successful and extract user ID
        const success = regRes.status === 201 || regRes.status === 200;
        check(regRes, { 'registration status 201/200': () => success });
        successRate.add(success);
        
        if (success) {
          try {
            const responseBody = JSON.parse(regRes.body);
            if (responseBody.user && responseBody.user._id) {
              userId = responseBody.user._id;
            } else if (responseBody.user && responseBody.user.id) {
              userId = responseBody.user.id;
            } else if (responseBody._id) {
              userId = responseBody._id;
            } else if (responseBody.id) {
              userId = responseBody.id;
            }
            
            if (userId) {
              console.log(`User registered with ID: ${userId}`);
              
              // Store the email for login
              const userEmail = `user${__VU}_${timestamp}_${random}@test.com`;
              
              // Login with newly created user
              const loginPayload = JSON.stringify({
                email: userEmail,
                password: 'Test1234!'
              });
              
              const loginRes = http.post('http://localhost:5001/api/auth/login', loginPayload, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 10000
              });
              
              loginTrend.add(loginRes.timings.duration);
              
              const loginSuccess = loginRes.status === 200;
              check(loginRes, { 'login status 200': () => loginSuccess });
              successRate.add(loginSuccess);
              
              if (loginSuccess) {
                try {
                  const loginBody = JSON.parse(loginRes.body);
                  
                  if (loginBody.token) {
                    token = loginBody.token;
                  } else if (loginBody.accessToken) {
                    token = loginBody.accessToken;
                  } else if (loginBody.access_token) {
                    token = loginBody.access_token;
                  } else if (loginBody.data && loginBody.data.token) {
                    token = loginBody.data.token;
                  }
                  
                  if (token) {
                    console.log('Login successful with newly created user');
                  }
                } catch (e) {
                  console.log(`Failed to parse login response: ${e.message}`);
                }
              }
            }
          } catch (e) {
            console.log(`Failed to parse registration response: ${e.message}`);
          }
        }
      } catch (e) {
        console.log(`Registration request failed: ${e.message}`);
      }
    });
  }

  // Profile Update (boundary/exceptional)
  if (token) {
    group('Profile Update', function () {
      const profilePayload = JSON.stringify({
        firstName: 'A', // boundary: min length
        lastName: 'B', // boundary: min length
        phone: 'not-a-phone' // invalid phone
      });
      const profileRes = http.put('http://localhost:5001/api/profile', profilePayload, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });
      profileTrend.add(profileRes.timings.duration);
      check(profileRes, {
        'profile status 200/400': (r) => r.status === 200 || r.status === 400,
        'profile validation error': (r) => r.status === 400 || r.json('error') !== undefined
      });
      successRate.add(profileRes.status === 200 || profileRes.status === 400);
    });
  }
