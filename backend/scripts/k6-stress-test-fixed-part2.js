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
