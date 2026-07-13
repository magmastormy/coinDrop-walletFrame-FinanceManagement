/**
 * OpenAPI Schemas
 * 
 * This module defines reusable schemas for the OpenAPI specification.
 * These schemas represent the data models used throughout the API.
 * 
 * @module docs/schemas
 */

/**
 * User Schema
 * Represents a user in the system
 */
const User = {
  type: 'object',
  properties: {
    _id: {
      type: 'string',
      description: 'Unique user identifier (MongoDB ObjectId)',
      example: '507f1f77bcf86cd799439011'
    },
    username: {
      type: 'string',
      description: 'Unique username (3-20 characters)',
      minLength: 3,
      maxLength: 20,
      example: 'johndoe'
    },
    email: {
      type: 'string',
      format: 'email',
      description: 'User email address',
      example: 'john.doe@example.com'
    },
    firstName: {
      type: 'string',
      description: 'User first name',
      example: 'John'
    },
    lastName: {
      type: 'string',
      description: 'User last name',
      example: 'Doe'
    },
    role: {
      type: 'string',
      enum: ['user', 'admin'],
      description: 'User role in the system',
      example: 'user'
    },
    profilePicture: {
      type: 'string',
      description: 'URL to user profile picture',
      example: 'https://example.com/avatars/johndoe.png'
    },
    isVerified: {
      type: 'boolean',
      description: 'Whether the user email is verified',
      example: true
    },
    lastLogin: {
      type: 'string',
      format: 'date-time',
      description: 'Timestamp of last login',
      example: '2024-01-15T10:30:00.000Z'
    },
    createdAt: {
      type: 'string',
      format: 'date-time',
      description: 'Account creation timestamp',
      example: '2024-01-01T00:00:00.000Z'
    },
    updatedAt: {
      type: 'string',
      format: 'date-time',
      description: 'Last update timestamp',
      example: '2024-01-15T10:30:00.000Z'
    }
  },
  required: ['username', 'email', 'firstName', 'lastName']
};

/**
 * Transaction Schema
 * Represents a financial transaction
 */
const Transaction = {
  type: 'object',
  properties: {
    _id: {
      type: 'string',
      description: 'Unique transaction identifier',
      example: '507f1f77bcf86cd799439012'
    },
    userId: {
      type: 'string',
      description: 'ID of the user who owns this transaction',
      example: '507f1f77bcf86cd799439011'
    },
    type: {
      type: 'string',
      enum: ['income', 'expense'],
      description: 'Transaction type',
      example: 'expense'
    },
    amount: {
      type: 'number',
      minimum: 0,
      description: 'Transaction amount',
      example: 150.50
    },
    categoryId: {
      type: 'string',
      description: 'ID of the transaction category',
      example: '507f1f77bcf86cd799439013'
    },
    walletId: {
      type: 'string',
      description: 'ID of the wallet used for this transaction',
      example: '507f1f77bcf86cd799439014'
    },
    description: {
      type: 'string',
      maxLength: 500,
      description: 'Transaction description',
      example: 'Grocery shopping at Walmart'
    },
    tags: {
      type: 'array',
      items: {
        type: 'string',
        maxLength: 50
      },
      description: 'Tags associated with the transaction',
      example: ['groceries', 'monthly']
    },
    date: {
      type: 'string',
      format: 'date-time',
      description: 'Transaction date',
      example: '2024-01-15T10:30:00.000Z'
    },
    isRecurring: {
      type: 'boolean',
      description: 'Whether this is a recurring transaction',
      example: false
    },
    recurringPattern: {
      type: 'object',
      properties: {
        frequency: {
          type: 'string',
          enum: ['daily', 'weekly', 'monthly', 'yearly'],
          example: 'monthly'
        },
        interval: {
          type: 'integer',
          minimum: 1,
          example: 1
        },
        endDate: {
          type: 'string',
          format: 'date-time',
          example: '2024-12-31T23:59:59.999Z'
        },
        nextOccurrence: {
          type: 'string',
          format: 'date-time',
          example: '2024-02-15T10:30:00.000Z'
        }
      }
    },
    attachments: {
      type: 'array',
      items: {
        type: 'string'
      },
      description: 'URLs to attached files (receipts, etc.)',
      example: ['https://example.com/receipts/123.pdf']
    },
    createdAt: {
      type: 'string',
      format: 'date-time',
      description: 'Transaction creation timestamp',
      example: '2024-01-15T10:30:00.000Z'
    },
    updatedAt: {
      type: 'string',
      format: 'date-time',
      description: 'Last update timestamp',
      example: '2024-01-15T10:30:00.000Z'
    }
  },
  required: ['userId', 'type', 'amount']
};

/**
 * Category Schema
 * Represents a transaction category
 */
const Category = {
  type: 'object',
  properties: {
    _id: {
      type: 'string',
      description: 'Unique category identifier',
      example: '507f1f77bcf86cd799439013'
    },
    name: {
      type: 'string',
      maxLength: 100,
      description: 'Category name',
      example: 'Food & Dining'
    },
    type: {
      type: 'string',
      enum: ['income', 'expense'],
      description: 'Category type',
      example: 'expense'
    },
    userId: {
      type: 'string',
      description: 'ID of the user who owns this category',
      example: '507f1f77bcf86cd799439011'
    },
    parentId: {
      type: 'string',
      nullable: true,
      description: 'ID of parent category (for subcategories)',
      example: '507f1f77bcf86cd799439015'
    },
    color: {
      type: 'string',
      pattern: '^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$',
      description: 'Category color in hex format',
      example: '#3B82F6'
    },
    icon: {
      type: 'string',
      description: 'Category icon identifier',
      example: 'utensils'
    },
    isDefault: {
      type: 'boolean',
      description: 'Whether this is a default system category',
      example: false
    },
    isActive: {
      type: 'boolean',
      description: 'Whether the category is active',
      example: true
    },
    description: {
      type: 'string',
      maxLength: 255,
      description: 'Category description',
      example: 'All food and dining expenses'
    },
    createdAt: {
      type: 'string',
      format: 'date-time',
      description: 'Category creation timestamp',
      example: '2024-01-01T00:00:00.000Z'
    },
    updatedAt: {
      type: 'string',
      format: 'date-time',
      description: 'Last update timestamp',
      example: '2024-01-01T00:00:00.000Z'
    }
  },
  required: ['name', 'type', 'userId']
};

/**
 * AuditLog Schema
 * Represents an audit log entry
 */
const AuditLog = {
  type: 'object',
  properties: {
    _id: {
      type: 'string',
      description: 'Unique audit log identifier',
      example: '507f1f77bcf86cd799439016'
    },
    adminId: {
      type: 'string',
      description: 'ID of the admin who performed the action',
      example: '507f1f77bcf86cd799439017'
    },
    action: {
      type: 'string',
      enum: ['CREATE', 'UPDATE', 'DELETE', 'VIEW', 'LOGIN', 'LOGOUT', 'EXPORT', 'SYSTEM_CONFIG'],
      description: 'Action performed',
      example: 'CREATE'
    },
    entityType: {
      type: 'string',
      enum: ['USER', 'TRANSACTION', 'CATEGORY', 'WALLET', 'BUDGET', 'SYSTEM'],
      description: 'Type of entity affected',
      example: 'USER'
    },
    entityId: {
      type: 'string',
      nullable: true,
      description: 'ID of the affected entity',
      example: '507f1f77bcf86cd799439011'
    },
    changes: {
      type: 'object',
      properties: {
        before: {
          type: 'object',
          description: 'Entity state before the action',
          example: null
        },
        after: {
          type: 'object',
          description: 'Entity state after the action',
          example: { username: 'johndoe', email: 'john@example.com' }
        }
      }
    },
    metadata: {
      type: 'object',
      properties: {
        ipAddress: {
          type: 'string',
          format: 'ipv4',
          example: '192.168.1.1'
        },
        userAgent: {
          type: 'string',
          example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        location: {
          type: 'string',
          example: 'New York, USA'
        },
        sessionId: {
          type: 'string',
          example: 'sess_123456789'
        },
        requestId: {
          type: 'string',
          example: '550e8400-e29b-41d4-a716-446655440000'
        },
        additionalInfo: {
          type: 'object',
          description: 'Additional contextual information'
        }
      }
    },
    timestamp: {
      type: 'string',
      format: 'date-time',
      description: 'When the action occurred',
      example: '2024-01-15T10:30:00.000Z'
    },
    status: {
      type: 'string',
      enum: ['SUCCESS', 'FAILED'],
      description: 'Action status',
      example: 'SUCCESS'
    },
    errorMessage: {
      type: 'string',
      nullable: true,
      description: 'Error message if action failed',
      example: null
    },
    createdAt: {
      type: 'string',
      format: 'date-time',
      description: 'Log creation timestamp',
      example: '2024-01-15T10:30:00.000Z'
    }
  },
  required: ['adminId', 'action', 'entityType']
};

/**
 * ErrorResponse Schema
 * Standardized error response format
 */
const ErrorResponse = {
  type: 'object',
  properties: {
    success: {
      type: 'boolean',
      example: false
    },
    error: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description: 'Error code identifier',
          example: 'VALIDATION_ERROR'
        },
        message: {
          type: 'string',
          description: 'Human-readable error message',
          example: 'Validation failed'
        },
        details: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              field: {
                type: 'string',
                example: 'email'
              },
              message: {
                type: 'string',
                example: 'Invalid email format'
              },
              value: {
                type: 'string',
                example: 'invalid-email'
              }
            }
          },
          description: 'Detailed validation errors'
        },
        timestamp: {
          type: 'string',
          format: 'date-time',
          example: '2024-01-15T10:30:00.000Z'
        }
      }
    }
  },
  required: ['success', 'error']
};

/**
 * DashboardOverview Schema
 * Dashboard overview data structure
 */
const DashboardOverview = {
  type: 'object',
  properties: {
    totalUsers: {
      type: 'integer',
      description: 'Total number of registered users',
      example: 1250
    },
    activeUsers: {
      type: 'integer',
      description: 'Number of users active in the last 30 days',
      example: 890
    },
    totalTransactions: {
      type: 'integer',
      description: 'Total number of transactions',
      example: 15420
    },
    totalTransactionAmount: {
      type: 'number',
      description: 'Total amount of all transactions',
      example: 1250000.50
    },
    recentActivities: {
      type: 'array',
      items: {
        $ref: '#/components/schemas/Transaction'
      },
      description: 'List of recent transactions'
    }
  }
};

/**
 * DashboardStatistics Schema
 * Dashboard statistics data structure
 */
const DashboardStatistics = {
  type: 'object',
  properties: {
    userGrowth: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          _id: {
            type: 'string',
            description: 'Date in YYYY-MM-DD format',
            example: '2024-01-15'
          },
          count: {
            type: 'integer',
            description: 'Number of new users on this date',
            example: 15
          }
        }
      },
      description: 'Daily user registration counts'
    },
    transactionStats: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          _id: {
            type: 'string',
            description: 'Date in YYYY-MM-DD format',
            example: '2024-01-15'
          },
          count: {
            type: 'integer',
            description: 'Number of transactions on this date',
            example: 150
          },
          totalAmount: {
            type: 'number',
            description: 'Total transaction amount on this date',
            example: 12500.50
          }
        }
      },
      description: 'Daily transaction statistics'
    },
    period: {
      type: 'object',
      properties: {
        start: {
          type: 'string',
          format: 'date',
          example: '2024-01-01'
        },
        end: {
          type: 'string',
          format: 'date',
          example: '2024-01-31'
        }
      }
    }
  }
};

/**
 * SystemHealth Schema
 * System health status data structure
 */
const SystemHealth = {
  type: 'object',
  properties: {
    status: {
      type: 'string',
      enum: ['healthy', 'degraded', 'unhealthy'],
      description: 'Overall system health status',
      example: 'healthy'
    },
    timestamp: {
      type: 'string',
      format: 'date-time',
      description: 'Health check timestamp',
      example: '2024-01-15T10:30:00.000Z'
    },
    database: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['connected', 'connecting', 'disconnecting', 'disconnected'],
          example: 'connected'
        },
        healthy: {
          type: 'boolean',
          example: true
        }
      }
    },
    memory: {
      type: 'object',
      properties: {
        rss: {
          type: 'integer',
          description: 'Resident set size in MB',
          example: 256
        },
        heapTotal: {
          type: 'integer',
          description: 'Total heap size in MB',
          example: 512
        },
        heapUsed: {
          type: 'integer',
          description: 'Used heap size in MB',
          example: 450
        },
        external: {
          type: 'integer',
          description: 'External memory in MB',
          example: 50
        },
        usagePercent: {
          type: 'integer',
          description: 'Heap usage percentage',
          example: 88
        },
        healthy: {
          type: 'boolean',
          example: true
        }
      }
    },
    uptime: {
      type: 'object',
      properties: {
        seconds: {
          type: 'integer',
          description: 'Uptime in seconds',
          example: 86400
        },
        formatted: {
          type: 'string',
          description: 'Formatted uptime string',
          example: '1d 0h 0m 0s'
        }
      }
    },
    environment: {
      type: 'string',
      description: 'Current environment',
      example: 'production'
    },
    version: {
      type: 'string',
      description: 'Application version',
      example: '1.0.0'
    }
  }
};

/**
 * SystemMetrics Schema
 * System performance metrics data structure
 */
const SystemMetrics = {
  type: 'object',
  properties: {
    performance: {
      type: 'object',
      properties: {
        responseTime: {
          type: 'string',
          description: 'Average response time',
          example: '45.23ms'
        },
        cpuUsage: {
          type: 'string',
          description: 'CPU usage percentage',
          example: '12.50%'
        }
      }
    },
    requests: {
      type: 'object',
      properties: {
        total: {
          type: 'integer',
          description: 'Total request count',
          example: 150000
        },
        errors: {
          type: 'integer',
          description: 'Total error count',
          example: 150
        },
        errorRate: {
          type: 'string',
          description: 'Error rate percentage',
          example: '0.10%'
        }
      }
    },
    connections: {
      type: 'object',
      properties: {
        database: {
          type: 'string',
          enum: ['connected', 'disconnected'],
          example: 'connected'
        }
      }
    },
    system: {
      type: 'object',
      properties: {
        nodeVersion: {
          type: 'string',
          example: 'v18.17.0'
        },
        platform: {
          type: 'string',
          example: 'linux'
        },
        arch: {
          type: 'string',
          example: 'x64'
        },
        pid: {
          type: 'integer',
          example: 12345
        }
      }
    },
    timestamp: {
      type: 'string',
      format: 'date-time',
      example: '2024-01-15T10:30:00.000Z'
    }
  }
};

/**
 * PaginationInfo Schema
 * Pagination metadata structure
 */
const PaginationInfo = {
  type: 'object',
  properties: {
    total: {
      type: 'integer',
      description: 'Total number of items',
      example: 1250
    },
    page: {
      type: 'integer',
      description: 'Current page number',
      example: 1
    },
    limit: {
      type: 'integer',
      description: 'Items per page',
      example: 10
    },
    totalPages: {
      type: 'integer',
      description: 'Total number of pages',
      example: 125
    }
  },
  required: ['total', 'page', 'limit', 'totalPages']
};

/**
 * SuccessResponse Schema
 * Standardized success response wrapper
 */
const SuccessResponse = {
  type: 'object',
  properties: {
    success: {
      type: 'boolean',
      example: true
    },
    data: {
      type: 'object',
      description: 'Response data payload'
    },
    message: {
      type: 'string',
      description: 'Human-readable success message',
      example: 'Operation completed successfully'
    },
    pagination: {
      $ref: '#/components/schemas/PaginationInfo'
    }
  },
  required: ['success']
};

/**
 * UserCreateRequest Schema
 * Request body for creating a new user
 */
const UserCreateRequest = {
  type: 'object',
  properties: {
    username: {
      type: 'string',
      minLength: 3,
      maxLength: 20,
      description: 'Unique username',
      example: 'johndoe'
    },
    email: {
      type: 'string',
      format: 'email',
      description: 'User email address',
      example: 'john.doe@example.com'
    },
    password: {
      type: 'string',
      minLength: 8,
      description: 'User password (must contain uppercase, lowercase, number, and special character)',
      example: 'SecurePass123!'
    },
    firstName: {
      type: 'string',
      description: 'User first name',
      example: 'John'
    },
    lastName: {
      type: 'string',
      description: 'User last name',
      example: 'Doe'
    },
    role: {
      type: 'string',
      enum: ['user', 'admin'],
      description: 'User role',
      example: 'user'
    },
    isVerified: {
      type: 'boolean',
      description: 'Whether the user email is verified',
      example: false
    }
  },
  required: ['username', 'email', 'password', 'firstName', 'lastName']
};

/**
 * UserUpdateRequest Schema
 * Request body for updating a user
 */
const UserUpdateRequest = {
  type: 'object',
  properties: {
    username: {
      type: 'string',
      minLength: 3,
      maxLength: 20,
      description: 'Unique username',
      example: 'johndoe'
    },
    email: {
      type: 'string',
      format: 'email',
      description: 'User email address',
      example: 'john.doe@example.com'
    },
    firstName: {
      type: 'string',
      description: 'User first name',
      example: 'John'
    },
    lastName: {
      type: 'string',
      description: 'User last name',
      example: 'Doe'
    },
    role: {
      type: 'string',
      enum: ['user', 'admin'],
      description: 'User role',
      example: 'user'
    },
    isVerified: {
      type: 'boolean',
      description: 'Whether the user email is verified',
      example: true
    },
    profilePicture: {
      type: 'string',
      description: 'URL to profile picture',
      example: 'https://example.com/avatar.png'
    }
  }
};

/**
 * ReportSummary Schema
 * Summary report data structure
 */
const ReportSummary = {
  type: 'object',
  properties: {
    userCount: {
      type: 'integer',
      description: 'Total number of users',
      example: 1250
    },
    verifiedUsers: {
      type: 'integer',
      description: 'Number of verified users',
      example: 980
    },
    transactionCount: {
      type: 'integer',
      description: 'Total number of transactions',
      example: 15420
    },
    totalTransactionAmount: {
      type: 'number',
      description: 'Total transaction amount',
      example: 1250000.50
    },
    period: {
      type: 'object',
      properties: {
        start: {
          type: 'string',
          example: '2024-01-01'
        },
        end: {
          type: 'string',
          example: '2024-12-31'
        }
      }
    },
    generatedAt: {
      type: 'string',
      format: 'date-time',
      example: '2024-01-15T10:30:00.000Z'
    }
  }
};

/**
 * ReportDetailed Schema
 * Detailed report data structure
 */
const ReportDetailed = {
  type: 'object',
  properties: {
    userGrowth: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          _id: {
            type: 'string',
            example: '2024-01-15'
          },
          count: {
            type: 'integer',
            example: 15
          }
        }
      }
    },
    transactionTrends: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          _id: {
            type: 'string',
            example: '2024-01-15'
          },
          count: {
            type: 'integer',
            example: 150
          },
          totalAmount: {
            type: 'number',
            example: 12500.50
          }
        }
      }
    },
    topUsers: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          userId: {
            type: 'string',
            example: '507f1f77bcf86cd799439011'
          },
          username: {
            type: 'string',
            example: 'johndoe'
          },
          email: {
            type: 'string',
            example: 'john@example.com'
          },
          count: {
            type: 'integer',
            example: 50
          },
          totalAmount: {
            type: 'number',
            example: 5000.00
          }
        }
      }
    },
    period: {
      type: 'object',
      properties: {
        start: {
          type: 'string',
          example: '2024-01-01'
        },
        end: {
          type: 'string',
          example: '2024-12-31'
        }
      }
    },
    generatedAt: {
      type: 'string',
      format: 'date-time',
      example: '2024-01-15T10:30:00.000Z'
    }
  }
};

/**
 * Wallet Schema
 * Represents a user wallet
 */
const Wallet = {
  type: 'object',
  properties: {
    _id: {
      type: 'string',
      description: 'Unique wallet identifier',
      example: '507f1f77bcf86cd799439014'
    },
    userId: {
      type: 'string',
      description: 'ID of the wallet owner',
      example: '507f1f77bcf86cd799439011'
    },
    name: {
      type: 'string',
      description: 'Wallet name',
      example: 'Main Checking'
    },
    type: {
      type: 'string',
      enum: ['checking', 'savings', 'credit', 'cash', 'investment', 'other'],
      description: 'Wallet type',
      example: 'checking'
    },
    balance: {
      type: 'number',
      description: 'Current wallet balance',
      example: 5000.00
    },
    currency: {
      type: 'string',
      description: 'Currency code (ISO 4217)',
      example: 'USD'
    },
    isDefault: {
      type: 'boolean',
      description: 'Whether this is the default wallet',
      example: true
    },
    createdAt: {
      type: 'string',
      format: 'date-time',
      example: '2024-01-01T00:00:00.000Z'
    },
    updatedAt: {
      type: 'string',
      format: 'date-time',
      example: '2024-01-15T10:30:00.000Z'
    }
  },
  required: ['userId', 'name', 'type']
};

/**
 * Budget Schema
 * Represents a user budget
 */
const Budget = {
  type: 'object',
  properties: {
    _id: {
      type: 'string',
      description: 'Unique budget identifier',
      example: '507f1f77bcf86cd799439018'
    },
    userId: {
      type: 'string',
      description: 'ID of the budget owner',
      example: '507f1f77bcf86cd799439011'
    },
    name: {
      type: 'string',
      description: 'Budget name',
      example: 'Monthly Expenses'
    },
    amount: {
      type: 'number',
      description: 'Budget amount limit',
      example: 2000.00
    },
    period: {
      type: 'string',
      enum: ['daily', 'weekly', 'monthly', 'yearly'],
      description: 'Budget period',
      example: 'monthly'
    },
    categories: {
      type: 'array',
      items: {
        type: 'string'
      },
      description: 'Category IDs included in this budget',
      example: ['507f1f77bcf86cd799439013']
    },
    startDate: {
      type: 'string',
      format: 'date-time',
      description: 'Budget start date',
      example: '2024-01-01T00:00:00.000Z'
    },
    endDate: {
      type: 'string',
      format: 'date-time',
      description: 'Budget end date',
      example: '2024-12-31T23:59:59.999Z'
    },
    isActive: {
      type: 'boolean',
      description: 'Whether the budget is active',
      example: true
    },
    createdAt: {
      type: 'string',
      format: 'date-time',
      example: '2024-01-01T00:00:00.000Z'
    },
    updatedAt: {
      type: 'string',
      format: 'date-time',
      example: '2024-01-15T10:30:00.000Z'
    }
  },
  required: ['userId', 'name', 'amount', 'period']
};

// Export all schemas
const schemas = {
  User,
  Transaction,
  Category,
  AuditLog,
  ErrorResponse,
  DashboardOverview,
  DashboardStatistics,
  SystemHealth,
  SystemMetrics,
  PaginationInfo,
  SuccessResponse,
  UserCreateRequest,
  UserUpdateRequest,
  ReportSummary,
  ReportDetailed,
  Wallet,
  Budget
};

module.exports = { schemas };
