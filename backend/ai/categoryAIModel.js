const logger = require('../utils/logger');

// backend/ai/categoryAIModel.js
const natural = require('natural');
const tokenizer = new natural.WordTokenizer();
const fs = require('fs');
const path = require('path');
const CategoryAIPattern = require('../models/CategoryAIPattern');

class CategoryAIModel {
  constructor() {
    this.tfidf = new natural.TfIdf();
    this.categories = [];
    this.isInitialized = false;
    this.loadPromise = null; // For thread-safe initialization
    this.defaultCategories = {
      'netflix': 'Subscriptions',
      'starbucks': 'Food', 
      'coffee': 'Food',
      'amazon': 'Shopping',
      'purchase': 'Shopping'
    };
    // Learning cache for user corrections (in-memory for fast access)
    this.learningCache = new Map();
    // Path for persisting TF-IDF model
    this.modelPath = path.join(__dirname, '../../data/tfidf-model.json');
    // Enhanced model features
    this.featureExtractor = new FeatureExtractor();
  }

  /**
   * Thread-safe category loading with mutex pattern
   */
  async loadCategories(categories) {
    // If already initializing, wait for it
    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = (async () => {
      try {
        this.categories = categories;
        this.tfidf = new natural.TfIdf(); // Fresh instance
        
        for (const cat of categories) {
          this.tfidf.addDocument(tokenizer.tokenize(cat.name.toLowerCase()));
        }
        
        // Load learned patterns from database
        await this.loadLearnedPatterns();
        
        this.isInitialized = true;
        logger.debug(`[CategoryAIModel] Loaded ${categories.length} categories and ${this.learningCache.size} learned patterns`);
        
        // Try to persist model for faster restarts
        await this.persistModel().catch(err => 
          logger.warn('[CategoryAIModel] Could not persist model:', err.message)
        );
      } catch (error) {
        logger.error('[CategoryAIModel] Error loading categories:', error);
        throw error;
      } finally {
        this.loadPromise = null;
      }
    })();

    return this.loadPromise;
  }

  /**
   * Load learned patterns from database into in-memory cache
   */
  async loadLearnedPatterns() {
    try {
      const patterns = await CategoryAIPattern.find({});
      patterns.forEach(pattern => {
        this.learningCache.set(pattern.description, pattern.categoryId);
      });
      logger.debug(`[CategoryAIModel] Loaded ${patterns.length} learned patterns from database`);
    } catch (error) {
      logger.warn('[CategoryAIModel] Error loading learned patterns:', error.message);
    }
  }

  /**
   * Persist TF-IDF model to disk for faster restarts
   */
  async persistModel() {
    try {
      const dataDir = path.dirname(this.modelPath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      
      // Serialize the model with enhanced features
      const modelData = {
        categories: this.categories.map(c => ({ name: c.name, id: c._id })),
        timestamp: new Date().toISOString(),
        learningCache: Array.from(this.learningCache.entries())
      };
      
      fs.writeFileSync(this.modelPath, JSON.stringify(modelData, null, 2));
    } catch (error) {
      logger.warn('[CategoryAIModel] Model persistence failed:', error.message);
    }
  }

  /**
   * Learn from user corrections (feedback loop)
   */
  async learnCorrection(description, categoryId) {
    const key = description.toLowerCase().trim();
    
    // Store in learning cache
    this.learningCache.set(key, categoryId);
    
    // Save to database for persistence
    try {
      await CategoryAIPattern.findOneAndUpdate(
        { description: key },
        { categoryId },
        { upsert: true, new: true }
      );
      logger.debug(`[CategoryAIModel] Learned: "${description}" -> Category ${categoryId} (saved to database)`);
    } catch (error) {
      logger.warn('[CategoryAIModel] Error saving learned pattern to database:', error.message);
    }
    
    // Periodically retrain model with new learnings
    if (this.learningCache.size % 10 === 0) {
      await this.retrainModel().catch(err => 
        logger.warn('[CategoryAIModel] Error retraining model:', err.message)
      );
    }
  }

  /**
   * Retrain the model with accumulated learnings
   */
  async retrainModel() {
    try {
      logger.debug('[CategoryAIModel] Retraining model with accumulated learnings...');
      // Reinitialize TF-IDF with learned patterns
      this.tfidf = new natural.TfIdf();
      
      // Add category names
      for (const cat of this.categories) {
        this.tfidf.addDocument(tokenizer.tokenize(cat.name.toLowerCase()));
      }
      
      // Add learned patterns
      for (const [description, categoryId] of this.learningCache.entries()) {
        const category = this.categories.find(c => c._id.toString() === categoryId.toString());
        if (category) {
          // Add description as another document for the category
          this.tfidf.addDocument(tokenizer.tokenize(description));
        }
      }
      
      logger.debug('[CategoryAIModel] Model retrained successfully');
    } catch (error) {
      logger.error('[CategoryAIModel] Error retraining model:', error);
      throw error;
    }
  }

  /**
   * Predict category for a single transaction
   */
  async predictCategory(description, amount = null, merchant = null) {
    // 1. Check learning cache first (exact matches)
    const key = description.toLowerCase().trim();
    if (this.learningCache.has(key)) {
      const categoryId = this.learningCache.get(key);
      const category = this.categories.find(c => c._id.toString() === categoryId.toString());
      if (category) {
        return { 
          ...category.toObject(), 
          isNew: false,
          confidence: 1.0
        };
      }
    }

    // 2. Check existing categories with enhanced features
    if (this.categories.length > 0) {
      const features = this.featureExtractor.extract(description, amount, merchant);
      const scores = [];
      
      // Calculate TF-IDF score
      const tokens = tokenizer.tokenize(description.toLowerCase());
      this.tfidf.tfidfs(tokens, (i, measure) => {
        // Enhance score with additional features
        let enhancedScore = measure;
        
        // Add merchant matching score
        if (merchant) {
          const categoryName = this.categories[i].name.toLowerCase();
          if (merchant.toLowerCase().includes(categoryName) || categoryName.includes(merchant.toLowerCase())) {
            enhancedScore += 0.3;
          }
        }
        
        // Add amount-based heuristics
        if (amount) {
          // Example: higher amounts might be different categories
          if (amount > 1000) {
            // High amount might be Travel, Electronics, etc.
            const highAmountCategories = ['Travel', 'Electronics', 'Home', 'Auto'];
            if (highAmountCategories.includes(this.categories[i].name)) {
              enhancedScore += 0.2;
            }
          } else if (amount < 20) {
            // Low amount might be Food, Coffee, etc.
            const lowAmountCategories = ['Food', 'Coffee', 'Entertainment'];
            if (lowAmountCategories.includes(this.categories[i].name)) {
              enhancedScore += 0.2;
            }
          }
        }
        
        scores.push({ 
          category: this.categories[i], 
          score: enhancedScore,
          confidence: Math.min(1.0, enhancedScore)
        });
      });
      
      scores.sort((a, b) => b.score - a.score);
      if (scores[0]?.score > 0.3) return { 
        ...scores[0].category.toObject(), 
        isNew: false,
        confidence: scores[0].confidence
      };
    }

    // 3. Suggest default categories
    for (const [pattern, categoryName] of Object.entries(this.defaultCategories)) {
      if (new RegExp(pattern, 'i').test(description)) {
        return {
          name: categoryName,
          isNew: true, // Flag as new (not in DB)
          suggestedPattern: pattern, // For learning
          confidence: 0.7
        };
      }
    }

    // 4. Fallback
    return { 
      name: 'Uncategorized', 
      isNew: false,
      confidence: 0.0
    };
  }

  /**
   * Batch predict categories for multiple transactions
   */
  async batchPredictCategories(transactions) {
    try {
      logger.debug(`[CategoryAIModel] Batch processing ${transactions.length} transactions`);
      
      const results = await Promise.all(
        transactions.map(async (transaction) => {
          const { description, amount, merchant } = transaction;
          const prediction = await this.predictCategory(description, amount, merchant);
          return {
            transactionId: transaction.id || transaction._id,
            prediction
          };
        })
      );
      
      logger.debug(`[CategoryAIModel] Batch prediction completed`);
      return results;
    } catch (error) {
      logger.error('[CategoryAIModel] Error in batch prediction:', error);
      throw error;
    }
  }

  /**
   * Batch learn from multiple corrections
   */
  async batchLearnCorrections(corrections) {
    try {
      logger.debug(`[CategoryAIModel] Batch learning from ${corrections.length} corrections`);
      
      const promises = corrections.map(async (correction) => {
        const { description, categoryId } = correction;
        await this.learnCorrection(description, categoryId);
      });
      
      await Promise.all(promises);
      
      // Retrain model after batch learning
      await this.retrainModel();
      
      logger.debug(`[CategoryAIModel] Batch learning completed`);
    } catch (error) {
      logger.error('[CategoryAIModel] Error in batch learning:', error);
      throw error;
    }
  }
}

/**
 * Feature extractor for enhanced model
 */
class FeatureExtractor {
  extract(description, amount, merchant) {
    const features = {
      descriptionLength: description.length,
      wordCount: description.split(' ').length,
      hasNumbers: /\d/.test(description),
      hasSpecialChars: /[^a-zA-Z0-9\s]/.test(description),
    };
    
    if (amount) {
      features.amount = amount;
      features.amountCategory = this.getAmountCategory(amount);
    }
    
    if (merchant) {
      features.merchantLength = merchant.length;
      features.merchantHasNumbers = /\d/.test(merchant);
    }
    
    return features;
  }
  
  getAmountCategory(amount) {
    if (amount < 10) return 'small';
    if (amount < 100) return 'medium';
    if (amount < 1000) return 'large';
    return 'very_large';
  }
}

module.exports = new CategoryAIModel();