# CoinDrop Database Models

## Overview

CoinDrop uses MongoDB as its primary database, with Mongoose as the ODM (Object Document Mapper). The database schema is designed to ensure data integrity, efficient querying, and scalability.

## Core Models

### User Model
```javascript
{
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 8
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  preferences: {
    currency: {
      type: String,
      default: 'USD'
    },
    language: {
      type: String,
      default: 'en'
    },
    theme: {
      type: String,
      enum: ['light', 'dark'],
      default: 'light'
    }
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  lastLogin: Date,
  resetPasswordToken: String,
  resetPasswordExpires: Date
}

Indexes:
- email: unique
- resetPasswordToken: sparse
```

### Wallet Model
```javascript
{
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['cash', 'bank', 'credit', 'investment'],
    required: true
  },
  currency: {
    type: String,
    required: true,
    default: 'USD'
  },
  balance: {
    type: Number,
    required: true,
    default: 0
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastUpdated: Date
}

Indexes:
- user: 1
- type: 1
- isArchived: 1
```

### Transaction Model
```javascript
{
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  wallet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Wallet',
    required: true
  },
  type: {
    type: String,
    enum: ['income', 'expense', 'transfer'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  location: {
    type: String,
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  receipt: {
    url: String,
    publicId: String
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringDetails: {
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly']
    },
    endDate: Date
  }
}

Indexes:
- user: 1
- wallet: 1
- date: -1
- category: 1
- type: 1
- isRecurring: 1
```

### Budget Model
```javascript
{
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true
  },
  period: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'yearly'],
    default: 'monthly'
  },
  categories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  startDate: {
    type: Date,
    required: true
  },
  endDate: Date,
  notifications: {
    enabled: {
      type: Boolean,
      default: true
    },
    threshold: {
      type: Number,
      default: 80
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}

Indexes:
- user: 1
- period: 1
- isActive: 1
- startDate: 1
```

## Data Validation and Middleware

### Pre-save Hooks
- Password hashing for User model
- Balance updates for Wallet model
- Date normalization for Transaction model
- Progress calculation for SavingsGoal model

### Virtual Fields
- User: fullName, age
- Wallet: formattedBalance
- Budget: remainingAmount, percentageUsed
- SavingsGoal: progressPercentage, remainingDays

### Custom Validators
- Email format validation
- Password strength requirements
- Currency code validation
- Date range validation
- Amount non-negative validation

## Relationships and References

### One-to-Many
- User -> Wallets
- User -> Transactions
- User -> Budgets
- User -> Categories
- User -> SavingsAccounts
- SavingsAccount -> SavingsGoals

### Many-to-Many
- Budget <-> Categories
- Transaction <-> Tags

## Data Integrity

### Cascading Deletes
- When a User is deleted:
  - Delete associated Wallets
  - Delete associated Transactions
  - Delete associated Budgets
  - Delete associated Categories
  - Delete associated SavingsAccounts and Goals

### Referential Integrity
- Transaction category must exist
- Transaction wallet must exist
- Budget categories must exist
- SavingsGoal account must exist

## Query Optimization

### Compound Indexes
```javascript
// Transaction queries by date range
{ user: 1, date: -1 }

// Budget performance queries
{ user: 1, period: 1, isActive: 1 }

// Category organization
{ user: 1, type: 1, parent: 1 }
```

### Projection Optimization
- Select specific fields for list views
- Populate related data only when needed
- Use lean queries for read-only operations

## Schema Evolution

### Version Control
- Schema version tracking
- Migration scripts
- Backward compatibility

### Extensibility
- Custom fields support
- Flexible metadata storage
- Feature flags integration
