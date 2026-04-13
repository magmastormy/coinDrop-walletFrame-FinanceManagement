const logger = require('../utils/logger');

        
        // If we still don't have a wallet ID, try to create one with retries
        if (!walletId) {
          // Try to create a wallet with our improved function
          walletId = createWallet(token);
          if (walletId) {
            logger.debug(`Successfully created wallet with ID: ${walletId}`);
          } else {
            logger.debug('Failed to create wallet after multiple attempts');
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
            logger.debug(`Transaction creation failed with status ${transactionRes.status}: ${transactionRes.body}`);
          } else {
            logger.debug(`Transaction created successfully with category ${categoryName} and wallet ID ${walletId}`);
          }
        }
      } catch (e) {
        logger.debug(`Transaction creation request failed: ${e.message}`);
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
          logger.debug('\n!!! WALLET DATA RETRIEVED SUCCESSFULLY !!!');
          logger.debug(`Number of wallets: ${Array.isArray(walletsData) ? walletsData.length : 'N/A'}`);
          
          if (Array.isArray(walletsData) && walletsData.length > 0) {
            logger.debug('First wallet details:');
            logger.debug(`  ID: ${walletsData[0]._id || walletsData[0].id || 'N/A'}`);
            logger.debug(`  Name: ${walletsData[0].name || 'N/A'}`);
            logger.debug(`  Balance: $${walletsData[0].balance || 0}`);
            logger.debug(`  Type: ${walletsData[0].type || 'N/A'}`);
          }
          logger.debug('!!! END WALLET DATA !!!\n');
        } catch (e) {
          logger.debug(`Failed to parse wallet data: ${e.message}`);
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
          logger.debug('\n!!! BUDGET DATA RETRIEVED SUCCESSFULLY !!!');
          logger.debug(`Number of budgets: ${Array.isArray(budgetsData) ? budgetsData.length : 'N/A'}`);
          
          if (Array.isArray(budgetsData) && budgetsData.length > 0) {
            logger.debug('First budget details:');
            logger.debug(`  ID: ${budgetsData[0]._id || budgetsData[0].id || 'N/A'}`);
            logger.debug(`  Name: ${budgetsData[0].name || 'N/A'}`);
            logger.debug(`  Amount: $${budgetsData[0].amount || 0}`);
            logger.debug(`  Category: ${budgetsData[0].category || 'N/A'}`);
          }
          logger.debug('!!! END BUDGET DATA !!!\n');
        } catch (e) {
          logger.debug(`Failed to parse budget data: ${e.message}`);
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
          logger.debug('\n!!! DASHBOARD DATA RETRIEVED SUCCESSFULLY !!!');
          logger.debug(`Total Balance: ${dashData.totalBalance || 0}`);
          logger.debug(`Total Expenses: ${dashData.totalExpenses || 0}`);
          logger.debug(`Total Savings: ${dashData.totalSavings || 0}`);
          logger.debug(`Expense Change: ${dashData.expenseChange || 0}%`);
          logger.debug('!!! END DASHBOARD DATA !!!\n');
        } catch (e) {
          logger.debug(`Failed to parse dashboard data: ${e.message}`);
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
        logger.debug(`AI chat failed with status ${aiRes.status}: ${aiRes.body}`);
      } else {
        try {
          const aiResponse = JSON.parse(aiRes.body);
          logger.debug('\n\n!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
          logger.debug('!!!!!!!!!!! AI CHAT RESPONSE RECEIVED !!!!!!!!!!!');
          logger.debug('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
          logger.debug(`USER QUERY: 'Give me a quick summary of my finances'`);
          logger.debug('----------------------------------------------');
          
          if (aiResponse.response) {
            // Format and display the AI response for better readability
            const formattedResponse = aiResponse.response
              .replace(/\n/g, '\n  ') // Indent new lines for better console readability
              .trim();
            
            logger.debug(`AI RESPONSE:\n  ${formattedResponse}`);
            logger.debug('----------------------------------------------');
            
            // Log performance metrics if available
            logger.debug('AI PERFORMANCE METRICS:');
            
            // If using the optimized process pooling
            if (aiResponse.metrics) {
              logger.debug(`  Processing Time: ${aiResponse.metrics.processingTime || 'N/A'}ms`);
              logger.debug(`  Context Size: ${aiResponse.metrics.contextSize || 'N/A'} characters`);
              logger.debug(`  Response Size: ${aiResponse.metrics.responseSize || 'N/A'} characters`);
              
              // Additional metrics that might be available with your optimizations
              if (aiResponse.metrics.pythonProcessTime) {
                logger.debug(`  Python Process Time: ${aiResponse.metrics.pythonProcessTime}ms`);
              }
              if (aiResponse.metrics.contextBuildTime) {
                logger.debug(`  Context Build Time: ${aiResponse.metrics.contextBuildTime}ms`);
              }
              if (aiResponse.metrics.apiCallTime) {
                logger.debug(`  API Call Time: ${aiResponse.metrics.apiCallTime}ms`);
              }
              if (aiResponse.metrics.processPooling) {
                logger.debug(`  Process Pooling: ${aiResponse.metrics.processPooling ? 'Enabled' : 'Disabled'}`);
              }
              if (aiResponse.metrics.pooledProcessId) {
                logger.debug(`  Pooled Process ID: ${aiResponse.metrics.pooledProcessId}`);
              }
            } else {
              logger.debug('  No detailed metrics available');
            }
            
            // Log response timing from k6
            logger.debug(`  Total Request Duration: ${aiRes.timings.duration.toFixed(2)}ms`);
            logger.debug(`  Time to First Byte: ${aiRes.timings.receiving.toFixed(2)}ms`);
          } else {
            logger.debug('AI chat successful but no response content found');
          }
          logger.debug('==============================================\n');
        } catch (e) {
          logger.debug('AI chat successful but could not parse response');
        }
      }
      successRate.add(aiRes.status === 200);
    });
  }

  // Add longer sleep between requests to reduce rate limiting
  sleep(Math.random() * 3 + 2); // Sleep between 2 and 5 seconds
}
