const mongoose = require('mongoose');

const categoryAIPatternSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster lookups
categoryAIPatternSchema.index({ description: 1 });

// Update timestamp on save
categoryAIPatternSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const CategoryAIPattern = mongoose.model('CategoryAIPattern', categoryAIPatternSchema);

module.exports = CategoryAIPattern;