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
  // Create wallet (only for some users to avoid too many duplicates)
  if (token && (__VU % 3 === 0)) {
    group('Create Wallet', function () {
      const walletPayload = JSON.stringify({
        name: `Wallet ${__VU}`,
        type: 'cash',
        balance: Math.floor(Math.random() * 10000),
        currency: 'USD'
      });
      const walletRes = createWithRetry('http://localhost:5001/api/wallets', walletPayload, token, 'wallet creation');
      check(walletRes, { 'wallet creation status 201/200': (r) => r.status === 201 || r.status === 200 });
      successRate.add(walletRes.status === 201 || walletRes.status === 200);
    });
  }

  // Create budget (only for some users)
  if (token && (__VU % 4 === 0)) {
    group('Create Budget', function () {
      try {
        // First, check if we need to create a category or if it already exists
        let categoryId = null;
        const categories = ['Food', 'Transportation', 'Entertainment', 'Shopping', 'Utilities'];
        const categoryName = categories[__VU % categories.length];
        
        // Try to get existing categories
        const categoriesRes = http.get('http://localhost:5001/api/categories', {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          timeout: 5000
        });
        
        if (categoriesRes.status === 200) {
          try {
            const categoriesData = JSON.parse(categoriesRes.body);
            if (Array.isArray(categoriesData)) {
              // Find a matching category
              const matchingCategory = categoriesData.find(cat => 
                cat.name && cat.name.toLowerCase() === categoryName.toLowerCase());
              
              if (matchingCategory) {
                categoryId = matchingCategory._id || matchingCategory.id;
              }
            }
          } catch (e) {
            console.log(`Failed to parse categories response: ${e.message}`);
          }
        }
        
        // First, get a wallet ID for the budget
        let walletId = null;
        
        // Try to get existing wallets
        const walletsRes = http.get('http://localhost:5001/api/wallets', {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          timeout: 5000
        });
        
        if (walletsRes.status === 200) {
          try {
            const walletsData = JSON.parse(walletsRes.body);
            if (Array.isArray(walletsData) && walletsData.length > 0) {
              // Use the first wallet if available
              if (walletsData[0]._id) {
                walletId = walletsData[0]._id;
              } else if (walletsData[0].id) {
                walletId = walletsData[0].id;
              }
            }
          } catch (e) {
            console.log(`Failed to parse wallets response: ${e.message}`);
          }
        }
        
        // If no wallet found, create one
        if (!walletId) {
          const walletPayload = JSON.stringify({
            name: `Wallet ${__VU}_${new Date().getTime()}`,
            type: 'cash',
            balance: Math.floor(Math.random() * 10000),
            currency: 'USD'
          });
          
          const createWalletRes = createWithRetry('http://localhost:5001/api/wallets', walletPayload, token, 'wallet creation');
          if (createWalletRes.status === 201 || createWalletRes.status === 200) {
            try {
              const walletData = JSON.parse(createWalletRes.body);
              if (walletData._id) {
                walletId = walletData._id;
              } else if (walletData.id) {
                walletId = walletData.id;
              }
            } catch (e) {
              console.log(`Failed to parse wallet creation response: ${e.message}`);
            }
          }
        }
        
        // Create the budget with proper category and wallet IDs
        const timestamp = new Date().getTime();
        
        // Only proceed if we have both a wallet ID and either a category ID or can create a category
        if (walletId) {
          // Generate a description for the budget
          const budgetDescriptions = {
            'Food': 'Monthly food budget including groceries, dining out, and coffee',
            'Transportation': 'Monthly transportation budget for commuting, gas, and occasional rideshares',
            'Entertainment': 'Monthly entertainment budget for streaming services, movies, and events',
            'Shopping': 'Monthly shopping budget for clothing, electronics, and household items',
            'Utilities': 'Monthly utilities budget for electricity, water, internet, and phone'
          };
          
          // IMPORTANT: Do not include nested category object, just use categoryId directly
          const budgetPayload = JSON.stringify({
            name: `${categoryName} Budget ${timestamp}`,
            amount: Math.floor(Math.random() * 500) + 100,
            period: 'monthly',
            description: budgetDescriptions[categoryName] || `Monthly budget for ${categoryName}`,
            // Use direct categoryId field (not nested object)
            categoryId: categoryId,
            // Include metadata for AI analysis
            metadata: {
              priority: ['High', 'Medium', 'Low'][Math.floor(Math.random() * 3)],
              tags: [categoryName.toLowerCase(), 'budget', 'monthly'],
              // Store category name here for reference
              categoryName: categoryName
            },
            walletId: walletId  // Direct walletId field
          });
          
          const budgetRes = http.post('http://localhost:5001/api/budgets', budgetPayload, {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            timeout: 8000
          });
          
          const success = budgetRes.status === 201 || budgetRes.status === 200;
          check(budgetRes, { 'budget creation status 201/200': () => success });
          successRate.add(success);
          
          if (!success) {
            console.log(`Budget creation failed with status ${budgetRes.status}: ${budgetRes.body}`);
          }
        }
      } catch (e) {
        console.log(`Budget creation request failed: ${e.message}`);
      }
    });
  }

  // Create transaction (for most users)
  if (token && (__VU % 2 === 0)) {
    group('Create Transaction', function () {
      // First, check if we need to create a wallet first (transactions might require a wallet)
      let walletId = null;
      
      try {
        // Get existing wallets
        const walletsRes = http.get('http://localhost:5001/api/wallets', {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          timeout: 5000
        });
        
        if (walletsRes.status === 200) {
          try {
            const walletsData = JSON.parse(walletsRes.body);
            if (Array.isArray(walletsData) && walletsData.length > 0) {
              // Use the first wallet if available
              if (walletsData[0]._id) {
                walletId = walletsData[0]._id;
              } else if (walletsData[0].id) {
                walletId = walletsData[0].id;
              }
            }
          } catch (e) {
            console.log(`Failed to parse wallets response: ${e.message}`);
          }
        }
        
        // If no wallet found, create one
        if (!walletId) {
          const walletPayload = JSON.stringify({
            name: `Wallet ${__VU}_${new Date().getTime()}`,
            type: 'cash',
            balance: Math.floor(Math.random() * 10000),
            currency: 'USD'
          });
          
          const createWalletRes = createWithRetry('http://localhost:5001/api/wallets', walletPayload, token, 'wallet creation');
          if (createWalletRes.status === 201 || createWalletRes.status === 200) {
            try {
              const walletData = JSON.parse(createWalletRes.body);
              if (walletData._id) {
                walletId = walletData._id;
              } else if (walletData.id) {
                walletId = walletData.id;
              }
            } catch (e) {
              console.log(`Failed to parse wallet creation response: ${e.message}`);
            }
          }
        }
        
        // Now create the transaction with more detailed descriptions
        const categories = ['Food', 'Transportation', 'Entertainment', 'Shopping', 'Utilities'];
        
        // More detailed descriptions for each category
        const categoryDescriptions = {
          'Food': [
            'Weekly grocery shopping at Whole Foods',
            'Lunch with colleagues at Italian restaurant',
            'Coffee and pastry at local café',
            'Takeout dinner from Thai restaurant',
            'Monthly Costco bulk shopping'
          ],
          'Transportation': [
            'Monthly subway pass renewal',
            'Uber ride to airport',
            'Gas station fill-up',
            'Car maintenance - oil change',
            'Parking fee downtown'
          ],
          'Entertainment': [
            'Movie tickets for new Marvel film',
            'Concert tickets - local band',
            'Netflix monthly subscription',
            'Video game purchase on Steam',
            'Museum admission fee'
          ],
          'Shopping': [
            'New work shirt from department store',
            'Amazon order - household items',
            'Birthday gift for friend',
            'New smartphone case',
            'Bookstore purchase - non-fiction'
          ],
          'Utilities': [
            'Monthly electricity bill payment',
            'Water and sewage quarterly payment',
            'Internet service provider monthly fee',
            'Mobile phone bill payment',
            'Natural gas bill payment'
          ]
        };
        const categoryName = categories[__VU % categories.length];
        
        // Try to get a category ID first
        let categoryId = null;
        
        // Try to get existing categories
        const categoriesRes = http.get('http://localhost:5001/api/categories', {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          timeout: 5000
        });
        
        if (categoriesRes.status === 200) {
          try {
            const categoriesData = JSON.parse(categoriesRes.body);
            if (Array.isArray(categoriesData)) {
              // Find a matching category
              const matchingCategory = categoriesData.find(cat => 
                cat.name && cat.name.toLowerCase() === categoryName.toLowerCase());
              
              if (matchingCategory) {
                categoryId = matchingCategory._id || matchingCategory.id;
              }
            }
          } catch (e) {
            console.log(`Failed to parse categories response: ${e.message}`);
          }
        }
        
        // Select a random description from the appropriate category
        const descriptionIndex = Math.floor(Math.random() * categoryDescriptions[categoryName].length);
        const description = categoryDescriptions[categoryName][descriptionIndex];
        
        // Generate a realistic amount based on the category
        let amount;
        switch(categoryName) {
          case 'Food':
            amount = Math.floor(Math.random() * 80) + 20; // $20-$100
            break;
          case 'Transportation':
            amount = Math.floor(Math.random() * 150) + 10; // $10-$160
            break;
          case 'Entertainment':
            amount = Math.floor(Math.random() * 100) + 15; // $15-$115
            break;
          case 'Shopping':
            amount = Math.floor(Math.random() * 200) + 25; // $25-$225
            break;
          case 'Utilities':
            amount = Math.floor(Math.random() * 150) + 50; // $50-$200
            break;
          default:
            amount = Math.floor(Math.random() * 100) + 10; // $10-$110
        }
        
        // Generate a realistic date within the last 30 days
        const now = new Date();
        const daysAgo = Math.floor(Math.random() * 30);
        const transactionDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
        
        // Create a category with retry logic
        function createCategory(token, userId) {
          let retries = 3;
          let delay = 1000; // Start with 1 second delay
          
          while (retries > 0) {
            try {
              // Generate a truly unique category name with timestamp to avoid conflicts
              const timestamp = new Date().getTime();
              const randomSuffix = Math.floor(Math.random() * 10000);
              const categoryName = `Entertainment_${timestamp}_${randomSuffix}`;
              
              console.log(`Attempting to create category: ${categoryName}`);
              
              const categoryPayload = JSON.stringify({
                name: categoryName,
                description: `Category for entertainment expenses`,
                color: ['#FF5733', '#33FF57', '#3357FF', '#F3FF33', '#FF33F3'][Math.floor(Math.random() * 5)]
              });
              
              const createCategoryRes = http.post('http://localhost:5001/api/categories', categoryPayload, {
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                timeout: 8000
              });
              
              // Handle rate limiting
              if (handleRateLimit(createCategoryRes, 'category creation')) {
                retries--;
                if (retries > 0) {
                  sleep(delay);
                  delay *= 2; // Exponential backoff
                  continue;
                }
                return null;
              }
              
              if (createCategoryRes.status === 201 || createCategoryRes.status === 200) {
                try {
                  const categoryData = JSON.parse(createCategoryRes.body);
                  if (categoryData._id) {
                    return categoryData._id;
                  } else if (categoryData.id) {
                    return categoryData.id;
                  }
                } catch (e) {
                  console.log(`Failed to parse category creation response: ${e.message}`);
                }
              } else {
                console.log(`Failed to create category. Status: ${createCategoryRes.status}, Response: ${createCategoryRes.body}`);
              }
              
              // If we get here, the request failed but wasn't rate limited
              retries--;
              if (retries > 0) {
                sleep(delay);
                delay *= 2; // Exponential backoff
              }
            } catch (e) {
              console.log(`Category creation exception: ${e.message}`);
              retries--;
              if (retries > 0) {
                sleep(delay);
                delay *= 2; // Exponential backoff
              }
            }
          }
          
          return null;
        }
        
        // If we don't have a category ID, try to create one with retries
        if (!categoryId) {
          // Create category without using Promise
          categoryId = createCategory(token, userId);
          if (categoryId) {
            console.log(`Successfully created category with ID: ${categoryId}`);
          } else {
            console.log('Failed to create category after multiple attempts');
          }
        }
        
        // Create a wallet with retry logic
        function createWallet(token) {
          let retries = 3;
          let delay = 1000; // Start with 1 second delay
          
          while (retries > 0) {
            try {
              // Generate a truly unique wallet name with timestamp to avoid conflicts
              const timestamp = new Date().getTime();
              const randomSuffix = Math.floor(Math.random() * 10000);
              const uniqueWalletName = `Wallet_${__VU}_${timestamp}_${randomSuffix}`;
              
              const walletPayload = JSON.stringify({
                name: uniqueWalletName,
                type: 'cash',
                balance: 5000, // Start with $5000 balance
                currency: 'USD'
              });
              
              console.log(`Attempting to create wallet: ${uniqueWalletName}`);
              
              const createWalletRes = http.post('http://localhost:5001/api/wallets', walletPayload, {
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                timeout: 8000
              });
              
              // Handle rate limiting
              if (handleRateLimit(createWalletRes, 'wallet creation')) {
                retries--;
                if (retries > 0) {
                  sleep(delay);
                  delay *= 2; // Exponential backoff
                  continue;
                }
                return null;
              }
              
              if (createWalletRes.status === 201 || createWalletRes.status === 200) {
                try {
                  const walletData = JSON.parse(createWalletRes.body);
                  if (walletData._id) {
                    return walletData._id;
                  } else if (walletData.id) {
                    return walletData.id;
                  }
                } catch (e) {
                  console.log(`Failed to parse wallet creation response: ${e.message}`);
                }
              } else {
                console.log(`Failed to create wallet. Status: ${createWalletRes.status}, Response: ${createWalletRes.body}`);
              }
              
              // If we get here, the request failed but wasn't rate limited
              retries--;
              if (retries > 0) {
                sleep(delay);
                delay *= 2; // Exponential backoff
              }
            } catch (e) {
              console.log(`Wallet creation exception: ${e.message}`);
              retries--;
              if (retries > 0) {
                sleep(delay);
                delay *= 2; // Exponential backoff
              }
            }
          }
          
          return null;
        }
        
        // If we still don't have a wallet ID, try to create one with retries
        if (!walletId) {
          // Try to create a wallet with our improved function
          walletId = createWallet(token);
          if (walletId) {
            console.log(`Successfully created wallet with ID: ${walletId}`);
          } else {
            console.log('Failed to create wallet after multiple attempts');
          }
        }
        
        // Only proceed if we have both a wallet ID and category ID
        if (walletId && categoryId) {
          // Extract merchant from description
          const merchantMatch = description.match(/ at ([^,]+)/) || description.match(/ from ([^,]+)/);
          const merchant = merchantMatch ? merchantMatch[1] : '';
          
          // Build transaction payload based on API requirements
          // IMPORTANT: Do not include nested category object, just use categoryId directly
          const transactionPayload = JSON.stringify({
            amount: amount,
            type: 'expense',
            description: description,
            date: transactionDate.toISOString(),
            category: categoryId,
            wallet: walletId,
            merchant: merchant,
            notes: `Test transaction for stress testing - ${new Date().toISOString()}`,
            tags: ['test', 'stress-test']
          });
          
          const transactionRes = http.post('http://localhost:5001/api/transactions', transactionPayload, {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            timeout: 8000
          });
          
          const success = transactionRes.status === 201 || transactionRes.status === 200;
          check(transactionRes, { 'transaction creation status 201/200': () => success });
          successRate.add(success);
          
          if (!success) {
            console.log(`Transaction creation failed with status ${transactionRes.status}: ${transactionRes.body}`);
          } else {
            console.log(`Transaction created successfully with category ${categoryName} and wallet ID ${walletId}`);
          }
        }
      } catch (e) {
        console.log(`Transaction creation request failed: ${e.message}`);
      }
    });
  }

  // Wallets (GET)
  if (token) {
    group('Wallets', function () {
      const walletsRes = http.get('http://localhost:5001/api/wallets', {
        headers: {
          'Authorization': `Bearer ${token}`
        },
      });
      check(walletsRes, { 'wallets status 200': (r) => r.status === 200 });
      successRate.add(walletsRes.status === 200);
      
      // Add detailed wallet logging
      if (walletsRes.status === 200) {
        try {
          const walletsData = JSON.parse(walletsRes.body);
          console.log('\n!!! WALLET DATA RETRIEVED SUCCESSFULLY !!!');
          console.log(`Number of wallets: ${Array.isArray(walletsData) ? walletsData.length : 'N/A'}`);
          
          if (Array.isArray(walletsData) && walletsData.length > 0) {
            console.log('First wallet details:');
            console.log(`  ID: ${walletsData[0]._id || walletsData[0].id || 'N/A'}`);
            console.log(`  Name: ${walletsData[0].name || 'N/A'}`);
            console.log(`  Balance: $${walletsData[0].balance || 0}`);
            console.log(`  Type: ${walletsData[0].type || 'N/A'}`);
          }
          console.log('!!! END WALLET DATA !!!\n');
        } catch (e) {
          console.log(`Failed to parse wallet data: ${e.message}`);
        }
      }
    });
  }
  
  // Budgets (GET)
  if (token) {
    group('Budgets', function () {
      const budgetsRes = http.get('http://localhost:5001/api/budgets', {
        headers: {
          'Authorization': `Bearer ${token}`
        },
      });
      check(budgetsRes, { 'budgets status 200': (r) => r.status === 200 });
      successRate.add(budgetsRes.status === 200);
      
      // Add detailed budget logging
      if (budgetsRes.status === 200) {
        try {
          const budgetsData = JSON.parse(budgetsRes.body);
          console.log('\n!!! BUDGET DATA RETRIEVED SUCCESSFULLY !!!');
          console.log(`Number of budgets: ${Array.isArray(budgetsData) ? budgetsData.length : 'N/A'}`);
          
          if (Array.isArray(budgetsData) && budgetsData.length > 0) {
            console.log('First budget details:');
            console.log(`  ID: ${budgetsData[0]._id || budgetsData[0].id || 'N/A'}`);
            console.log(`  Name: ${budgetsData[0].name || 'N/A'}`);
            console.log(`  Amount: $${budgetsData[0].amount || 0}`);
            console.log(`  Category: ${budgetsData[0].category || 'N/A'}`);
          }
          console.log('!!! END BUDGET DATA !!!\n');
        } catch (e) {
          console.log(`Failed to parse budget data: ${e.message}`);
        }
      }
    });
  }
  
  // Analytics Overview (GET)
  if (token) {
    group('Analytics Overview', function () {
      // Use the correct analytics endpoint
      const dashRes = http.get('http://localhost:5001/api/analytics/overview', {
        headers: {
          'Authorization': `Bearer ${token}`
        },
      });
      
      check(dashRes, { 'dashboard status 200': (r) => r.status === 200 });
      dashboardTrend.add(dashRes.timings.duration);
      successRate.add(dashRes.status === 200);
      
      if (dashRes.status === 200) {
        try {
          const dashData = JSON.parse(dashRes.body);
          console.log('\n!!! DASHBOARD DATA RETRIEVED SUCCESSFULLY !!!');
          console.log(`Total Balance: ${dashData.totalBalance || 0}`);
          console.log(`Total Expenses: ${dashData.totalExpenses || 0}`);
          console.log(`Total Savings: ${dashData.totalSavings || 0}`);
          console.log(`Expense Change: ${dashData.expenseChange || 0}%`);
          console.log('!!! END DASHBOARD DATA !!!\n');
        } catch (e) {
          console.log(`Failed to parse dashboard data: ${e.message}`);
        }
      }
    });
  }

  // AI Chat - Run AFTER all other data creation
  // Only run for a small percentage of users to avoid overloading the AI service
  if (token && userId && (__VU % 10 === 0)) { // 10% of users will use the AI chat
    group('AI Chat', function () {
      const aiPayload = JSON.stringify({
        messages: [{ role: 'user', content: 'Give me a quick summary of my finances' }],
        userId: userId
      });
      
      // Use the correct endpoint for the AI chat
      const aiRes = http.post('http://localhost:5001/api/zhipuai/send', aiPayload, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        timeout: 30000, // 30s timeout for AI requests
        tags: { name: 'AI Chat' } // Tag for thresholds
      });
      
      aiTrend.add(aiRes.timings.duration);
      
      // Check if AI chat was successful
      const success = aiRes.status === 200;
      check(aiRes, { 'AI chat status 200': () => success });
      successRate.add(success);
      
      if (!success) {
        console.log(`AI chat failed with status ${aiRes.status}: ${aiRes.body}`);
      } else {
        try {
          const aiResponse = JSON.parse(aiRes.body);
          console.log('\n\n!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
          console.log('!!!!!!!!!!! AI CHAT RESPONSE RECEIVED !!!!!!!!!!!');
          console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
          console.log(`USER QUERY: 'Give me a quick summary of my finances'`);
          console.log('----------------------------------------------');
          
          if (aiResponse.response) {
            // Format and display the AI response for better readability
            const formattedResponse = aiResponse.response
              .replace(/\n/g, '\n  ') // Indent new lines for better console readability
              .trim();
            
            console.log(`AI RESPONSE:\n  ${formattedResponse}`);
            console.log('----------------------------------------------');
            
            // Log performance metrics if available
            console.log('AI PERFORMANCE METRICS:');
            
            // If using the optimized process pooling
            if (aiResponse.metrics) {
              console.log(`  Processing Time: ${aiResponse.metrics.processingTime || 'N/A'}ms`);
              console.log(`  Context Size: ${aiResponse.metrics.contextSize || 'N/A'} characters`);
              console.log(`  Response Size: ${aiResponse.metrics.responseSize || 'N/A'} characters`);
              
              // Additional metrics that might be available with your optimizations
              if (aiResponse.metrics.pythonProcessTime) {
                console.log(`  Python Process Time: ${aiResponse.metrics.pythonProcessTime}ms`);
              }
              if (aiResponse.metrics.contextBuildTime) {
                console.log(`  Context Build Time: ${aiResponse.metrics.contextBuildTime}ms`);
              }
              if (aiResponse.metrics.apiCallTime) {
                console.log(`  API Call Time: ${aiResponse.metrics.apiCallTime}ms`);
              }
              if (aiResponse.metrics.processPooling) {
                console.log(`  Process Pooling: ${aiResponse.metrics.processPooling ? 'Enabled' : 'Disabled'}`);
              }
              if (aiResponse.metrics.pooledProcessId) {
                console.log(`  Pooled Process ID: ${aiResponse.metrics.pooledProcessId}`);
              }
            } else {
              console.log('  No detailed metrics available');
            }
            
            // Log response timing from k6
            console.log(`  Total Request Duration: ${aiRes.timings.duration.toFixed(2)}ms`);
            console.log(`  Time to First Byte: ${aiRes.timings.receiving.toFixed(2)}ms`);
          } else {
            console.log('AI chat successful but no response content found');
          }
          console.log('==============================================\n');
        } catch (e) {
          console.log('AI chat successful but could not parse response');
        }
      }
      successRate.add(aiRes.status === 200);
    });
  }

  // Add longer sleep between requests to reduce rate limiting
  sleep(Math.random() * 3 + 2); // Sleep between 2 and 5 seconds
}
