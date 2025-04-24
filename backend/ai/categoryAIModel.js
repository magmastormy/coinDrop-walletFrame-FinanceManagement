// backend/ai/categoryAIModel.js
const natural = require('natural');
const tokenizer = new natural.WordTokenizer();

class CategoryAIModel {
  constructor() {
    this.tfidf = new natural.TfIdf();
    this.categories = [];
    this.defaultCategories = {
      'netflix': 'Subscriptions',
      'starbucks': 'Food',
      'coffee': 'Food',
      'amazon': 'Shopping',
      'purchase': 'Shopping'
    };
  }

  async loadCategories(categories) {
    this.categories = categories;
    categories.forEach(cat => {
      this.tfidf.addDocument(tokenizer.tokenize(cat.name.toLowerCase()));
    });
  }

  async predictCategory(description) {
    // 1. Check existing categories
    if (this.categories.length > 0) {
      const tokens = tokenizer.tokenize(description.toLowerCase());
      const scores = [];
      this.tfidf.tfidfs(tokens, (i, measure) => {
        scores.push({ category: this.categories[i], score: measure });
      });
      scores.sort((a, b) => b.score - a.score);
      if (scores[0]?.score > 0.3) return { 
        ...scores[0].category.toObject(), 
        isNew: false 
      };
    }

    // 2. Suggest default categories
    for (const [pattern, categoryName] of Object.entries(this.defaultCategories)) {
      if (new RegExp(pattern, 'i').test(description)) {
        return {
          name: categoryName,
          isNew: true, // Flag as new (not in DB)
          suggestedPattern: pattern // For learning
        };
      }
    }

    // 3. Fallback
    return { name: 'Uncategorized', isNew: false };
  }
}

module.exports = new CategoryAIModel();