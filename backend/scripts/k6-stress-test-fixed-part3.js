        
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
