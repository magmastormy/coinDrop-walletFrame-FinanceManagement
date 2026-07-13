/**
 * OpenAPI Response Components
 * 
 * This module defines reusable response components for the OpenAPI specification.
 * These responses represent standard HTTP responses used throughout the API.
 * 
 * @module docs/responses
 */

/**
 * Bad Request (400) Response
 * Used when the request contains invalid parameters or body
 */
const BadRequest = {
  description: 'Bad Request - The request contains invalid parameters or malformed data',
  content: {
    'application/json': {
      schema: {
        $ref: '#/components/schemas/ErrorResponse'
      },
      example: {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: [
            {
              field: 'email',
              message: 'Invalid email format',
              value: 'invalid-email-format'
            },
            {
              field: 'password',
              message: 'Password must be at least 8 characters long',
              value: 'short'
            }
          ],
          timestamp: '2024-01-15T10:30:00.000Z'
        }
      }
    }
  },
  headers: {
    'X-Request-Id': {
      $ref: '#/components/headers/XRequestId'
    }
  }
};

/**
 * Unauthorized (401) Response
 * Used when authentication is required but not provided or invalid
 */
const Unauthorized = {
  description: 'Unauthorized - Authentication is required and has failed or has not been provided',
  content: {
    'application/json': {
      schema: {
        $ref: '#/components/schemas/ErrorResponse'
      },
      examples: {
        missingToken: {
          summary: 'Missing authentication token',
          value: {
            success: false,
            error: {
              code: 'AUTHENTICATION_ERROR',
              message: 'Access token is required',
              timestamp: '2024-01-15T10:30:00.000Z'
            }
          }
        },
        invalidToken: {
          summary: 'Invalid or expired token',
          value: {
            success: false,
            error: {
              code: 'AUTHENTICATION_ERROR',
              message: 'Invalid or expired access token',
              timestamp: '2024-01-15T10:30:00.000Z'
            }
          }
        }
      }
    }
  },
  headers: {
    'X-Request-Id': {
      $ref: '#/components/headers/XRequestId'
    },
    'WWW-Authenticate': {
      description: 'Authentication method that should be used',
      schema: {
        type: 'string'
      },
      example: 'Bearer realm="api"'
    }
  }
};

/**
 * Forbidden (403) Response
 * Used when the user is authenticated but lacks permission
 */
const Forbidden = {
  description: 'Forbidden - The user does not have permission to access this resource',
  content: {
    'application/json': {
      schema: {
        $ref: '#/components/schemas/ErrorResponse'
      },
      examples: {
        insufficientPermissions: {
          summary: 'Insufficient permissions',
          value: {
            success: false,
            error: {
              code: 'AUTHORIZATION_ERROR',
              message: 'Access denied. Admin privileges required.',
              timestamp: '2024-01-15T10:30:00.000Z'
            }
          }
        },
        resourceAccessDenied: {
          summary: 'Resource access denied',
          value: {
            success: false,
            error: {
              code: 'AUTHORIZATION_ERROR',
              message: 'You do not have permission to access this resource',
              timestamp: '2024-01-15T10:30:00.000Z'
            }
          }
        }
      }
    }
  },
  headers: {
    'X-Request-Id': {
      $ref: '#/components/headers/XRequestId'
    }
  }
};

/**
 * Not Found (404) Response
 * Used when the requested resource does not exist
 */
const NotFound = {
  description: 'Not Found - The requested resource does not exist',
  content: {
    'application/json': {
      schema: {
        $ref: '#/components/schemas/ErrorResponse'
      },
      examples: {
        userNotFound: {
          summary: 'User not found',
          value: {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'User not found',
              resource: 'USER',
              timestamp: '2024-01-15T10:30:00.000Z'
            }
          }
        },
        transactionNotFound: {
          summary: 'Transaction not found',
          value: {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Transaction not found',
              resource: 'TRANSACTION',
              timestamp: '2024-01-15T10:30:00.000Z'
            }
          }
        },
        endpointNotFound: {
          summary: 'API endpoint not found',
          value: {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Cannot GET /api/unknown-endpoint',
              timestamp: '2024-01-15T10:30:00.000Z'
            }
          }
        }
      }
    }
  },
  headers: {
    'X-Request-Id': {
      $ref: '#/components/headers/XRequestId'
    }
  }
};

/**
 * Conflict (409) Response
 * Used when there is a conflict with the current state of the resource
 */
const Conflict = {
  description: 'Conflict - The request conflicts with the current state of the resource',
  content: {
    'application/json': {
      schema: {
        $ref: '#/components/schemas/ErrorResponse'
      },
      examples: {
        duplicateEmail: {
          summary: 'Duplicate email address',
          value: {
            success: false,
            error: {
              code: 'CONFLICT',
              message: 'User with this email already exists',
              timestamp: '2024-01-15T10:30:00.000Z'
            }
          }
        },
        duplicateUsername: {
          summary: 'Duplicate username',
          value: {
            success: false,
            error: {
              code: 'CONFLICT',
              message: 'User with this username already exists',
              timestamp: '2024-01-15T10:30:00.000Z'
            }
          }
        }
      }
    }
  },
  headers: {
    'X-Request-Id': {
      $ref: '#/components/headers/XRequestId'
    }
  }
};

/**
 * Too Many Requests (429) Response
 * Used when rate limit is exceeded
 */
const TooManyRequests = {
  description: 'Too Many Requests - Rate limit has been exceeded',
  content: {
    'application/json': {
      schema: {
        $ref: '#/components/schemas/ErrorResponse'
      },
      examples: {
        generalRateLimit: {
          summary: 'General API rate limit exceeded',
          value: {
            success: false,
            error: {
              code: 'RATE_LIMIT_EXCEEDED',
              message: 'Too many requests. Please try again later.',
              retryAfter: 900,
              timestamp: '2024-01-15T10:30:00.000Z'
            }
          }
        },
        aiRateLimit: {
          summary: 'AI endpoint rate limit exceeded',
          value: {
            success: false,
            error: {
              code: 'RATE_LIMIT_EXCEEDED',
              message: 'Too many AI requests. AI service is currently under high load.',
              retryAfter: 60,
              timestamp: '2024-01-15T10:30:00.000Z'
            }
          }
        },
        financialRateLimit: {
          summary: 'Financial operations rate limit exceeded',
          value: {
            success: false,
            error: {
              code: 'RATE_LIMIT_EXCEEDED',
              message: 'Too many financial operations, please slow down',
              retryAfter: 60,
              timestamp: '2024-01-15T10:30:00.000Z'
            }
          }
        }
      }
    }
  },
  headers: {
    'X-Request-Id': {
      $ref: '#/components/headers/XRequestId'
    },
    'X-RateLimit-Limit': {
      $ref: '#/components/headers/XRateLimitLimit'
    },
    'X-RateLimit-Remaining': {
      $ref: '#/components/headers/XRateLimitRemaining'
    },
    'X-RateLimit-Reset': {
      $ref: '#/components/headers/XRateLimitReset'
    },
    'Retry-After': {
      description: 'Seconds to wait before retrying',
      schema: {
        type: 'integer'
      },
      example: 60
    }
  }
};

/**
 * Internal Server Error (500) Response
 * Used when an unexpected server error occurs
 */
const InternalServerError = {
  description: 'Internal Server Error - An unexpected error occurred on the server',
  content: {
    'application/json': {
      schema: {
        $ref: '#/components/schemas/ErrorResponse'
      },
      examples: {
        genericError: {
          summary: 'Generic server error',
          value: {
            success: false,
            error: {
              code: 'INTERNAL_SERVER_ERROR',
              message: 'An unexpected error occurred. Please try again later.',
              timestamp: '2024-01-15T10:30:00.000Z'
            }
          }
        },
        databaseError: {
          summary: 'Database error',
          value: {
            success: false,
            error: {
              code: 'DATABASE_ERROR',
              message: 'Failed to fetch data from database',
              operation: 'aggregation',
              timestamp: '2024-01-15T10:30:00.000Z'
            }
          }
        }
      }
    }
  },
  headers: {
    'X-Request-Id': {
      $ref: '#/components/headers/XRequestId'
    }
  }
};

/**
 * Service Unavailable (503) Response
 * Used when the server is temporarily unavailable
 */
const ServiceUnavailable = {
  description: 'Service Unavailable - The server is temporarily unable to handle the request',
  content: {
    'application/json': {
      schema: {
        $ref: '#/components/schemas/ErrorResponse'
      },
      example: {
        success: false,
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'Server is currently at capacity. Please try again later.',
          timestamp: '2024-01-15T10:30:00.000Z'
        }
      }
    }
  },
  headers: {
    'X-Request-Id': {
      $ref: '#/components/headers/XRequestId'
    },
    'Retry-After': {
      description: 'Seconds to wait before retrying',
      schema: {
        type: 'integer'
      },
      example: 120
    }
  }
};

/**
 * Success (200) Response - Dashboard Overview
 */
const DashboardOverviewSuccess = {
  description: 'Dashboard overview retrieved successfully',
  content: {
    'application/json': {
      schema: {
        allOf: [
          { $ref: '#/components/schemas/SuccessResponse' },
          {
            type: 'object',
            properties: {
              data: {
                $ref: '#/components/schemas/DashboardOverview'
              }
            }
          }
        ]
      },
      example: {
        success: true,
        data: {
          totalUsers: 1250,
          activeUsers: 890,
          totalTransactions: 15420,
          totalTransactionAmount: 1250000.50,
          recentActivities: [
            {
              _id: '507f1f77bcf86cd799439012',
              userId: '507f1f77bcf86cd799439011',
              type: 'expense',
              amount: 150.50,
              description: 'Grocery shopping',
              date: '2024-01-15T10:30:00.000Z'
            }
          ]
        },
        message: 'Dashboard overview retrieved successfully'
      }
    }
  },
  headers: {
    'X-Request-Id': {
      $ref: '#/components/headers/XRequestId'
    }
  }
};

/**
 * Success (200) Response - Dashboard Statistics
 */
const DashboardStatisticsSuccess = {
  description: 'Dashboard statistics retrieved successfully',
  content: {
    'application/json': {
      schema: {
        allOf: [
          { $ref: '#/components/schemas/SuccessResponse' },
          {
            type: 'object',
            properties: {
              data: {
                $ref: '#/components/schemas/DashboardStatistics'
              }
            }
          }
        ]
      },
      example: {
        success: true,
        data: {
          userGrowth: [
            { _id: '2024-01-14', count: 12 },
            { _id: '2024-01-15', count: 15 }
          ],
          transactionStats: [
            { _id: '2024-01-14', count: 145, totalAmount: 12000.00 },
            { _id: '2024-01-15', count: 150, totalAmount: 12500.50 }
          ],
          period: {
            start: '2024-01-01',
            end: '2024-01-31'
          }
        },
        message: 'Dashboard statistics retrieved successfully'
      }
    }
  },
  headers: {
    'X-Request-Id': {
      $ref: '#/components/headers/XRequestId'
    }
  }
};

/**
 * Success (200) Response - User List
 */
const UserListSuccess = {
  description: 'Users retrieved successfully',
  content: {
    'application/json': {
      schema: {
        allOf: [
          { $ref: '#/components/schemas/SuccessResponse' },
          {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  users: {
                    type: 'array',
                    items: {
                      $ref: '#/components/schemas/User'
                    }
                  },
                  pagination: {
                    $ref: '#/components/schemas/PaginationInfo'
                  }
                }
              }
            }
          }
        ]
      },
      example: {
        success: true,
        data: {
          users: [
            {
              _id: '507f1f77bcf86cd799439011',
              username: 'johndoe',
              email: 'john.doe@example.com',
              firstName: 'John',
              lastName: 'Doe',
              role: 'user',
              isVerified: true,
              createdAt: '2024-01-01T00:00:00.000Z'
            }
          ],
          pagination: {
            total: 1250,
            page: 1,
            limit: 10,
            totalPages: 125
          }
        },
        message: 'Users retrieved successfully'
      }
    }
  },
  headers: {
    'X-Request-Id': {
      $ref: '#/components/headers/XRequestId'
    }
  }
};

/**
 * Success (200) Response - Single User
 */
const UserDetailSuccess = {
  description: 'User details retrieved successfully',
  content: {
    'application/json': {
      schema: {
        allOf: [
          { $ref: '#/components/schemas/SuccessResponse' },
          {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  user: {
                    $ref: '#/components/schemas/User'
                  },
                  transactions: {
                    type: 'array',
                    items: {
                      $ref: '#/components/schemas/Transaction'
                    }
                  },
                  wallets: {
                    type: 'array',
                    items: {
                      $ref: '#/components/schemas/Wallet'
                    }
                  }
                }
              }
            }
          }
        ]
      },
      example: {
        success: true,
        data: {
          user: {
            _id: '507f1f77bcf86cd799439011',
            username: 'johndoe',
            email: 'john.doe@example.com',
            firstName: 'John',
            lastName: 'Doe',
            role: 'user',
            isVerified: true,
            createdAt: '2024-01-01T00:00:00.000Z'
          },
          transactions: [],
          wallets: []
        },
        message: 'User details retrieved successfully'
      }
    }
  },
  headers: {
    'X-Request-Id': {
      $ref: '#/components/headers/XRequestId'
    }
  }
};

/**
 * Success (201) Response - User Created
 */
const UserCreatedSuccess = {
  description: 'User created successfully',
  content: {
    'application/json': {
      schema: {
        allOf: [
          { $ref: '#/components/schemas/SuccessResponse' },
          {
            type: 'object',
            properties: {
              data: {
                $ref: '#/components/schemas/User'
              }
            }
          }
        ]
      },
      example: {
        success: true,
        data: {
          _id: '507f1f77bcf86cd799439011',
          username: 'johndoe',
          email: 'john.doe@example.com',
          firstName: 'John',
          lastName: 'Doe',
          role: 'user',
          isVerified: false,
          createdAt: '2024-01-15T10:30:00.000Z'
        },
        message: 'User created successfully'
      }
    }
  },
  headers: {
    'X-Request-Id': {
      $ref: '#/components/headers/XRequestId'
    }
  }
};

/**
 * Success (200) Response - User Updated
 */
const UserUpdatedSuccess = {
  description: 'User updated successfully',
  content: {
    'application/json': {
      schema: {
        allOf: [
          { $ref: '#/components/schemas/SuccessResponse' },
          {
            type: 'object',
            properties: {
              data: {
                $ref: '#/components/schemas/User'
              }
            }
          }
        ]
      },
      example: {
        success: true,
        data: {
          _id: '507f1f77bcf86cd799439011',
          username: 'johndoe',
          email: 'john.doe@example.com',
          firstName: 'John',
          lastName: 'Doe',
          role: 'admin',
          isVerified: true,
          updatedAt: '2024-01-15T10:30:00.000Z'
        },
        message: 'User updated successfully'
      }
    }
  },
  headers: {
    'X-Request-Id': {
      $ref: '#/components/headers/XRequestId'
    }
  }
};

/**
 * Success (200) Response - User Deleted
 */
const UserDeletedSuccess = {
  description: 'User deleted successfully',
  content: {
    'application/json': {
      schema: {
        allOf: [
          { $ref: '#/components/schemas/SuccessResponse' },
          {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  userId: {
                    type: 'string'
                  },
                  deletedAt: {
                    type: 'string',
                    format: 'date-time'
                  }
                }
              }
            }
          }
        ]
      },
      example: {
        success: true,
        data: {
          userId: '507f1f77bcf86cd799439011',
          deletedAt: '2024-01-15T10:30:00.000Z'
        },
        message: 'User deleted successfully'
      }
    }
  },
  headers: {
    'X-Request-Id': {
      $ref: '#/components/headers/XRequestId'
    }
  }
};

/**
 * Success (200) Response - Transaction List
 */
const TransactionListSuccess = {
  description: 'Transactions retrieved successfully',
  content: {
    'application/json': {
      schema: {
        allOf: [
          { $ref: '#/components/schemas/SuccessResponse' },
          {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  transactions: {
                    type: 'array',
                    items: {
                      $ref: '#/components/schemas/Transaction'
                    }
                  },
                  pagination: {
                    $ref: '#/components/schemas/PaginationInfo'
                  }
                }
              }
            }
          }
        ]
      },
      example: {
        success: true,
        data: {
          transactions: [
            {
              _id: '507f1f77bcf86cd799439012',
              userId: '507f1f77bcf86cd799439011',
              type: 'expense',
              amount: 150.50,
              description: 'Grocery shopping',
              date: '2024-01-15T10:30:00.000Z'
            }
          ],
          pagination: {
            total: 15420,
            page: 1,
            limit: 10,
            totalPages: 1542
          }
        },
        message: 'Transactions retrieved successfully'
      }
    }
  },
  headers: {
    'X-Request-Id': {
      $ref: '#/components/headers/XRequestId'
    }
  }
};

/**
 * Success (200) Response - Single Transaction
 */
const TransactionDetailSuccess = {
  description: 'Transaction details retrieved successfully',
  content: {
    'application/json': {
      schema: {
        allOf: [
          { $ref: '#/components/schemas/SuccessResponse' },
          {
            type: 'object',
            properties: {
              data: {
                $ref: '#/components/schemas/Transaction'
              }
            }
          }
        ]
      },
      example: {
        success: true,
        data: {
          _id: '507f1f77bcf86cd799439012',
          userId: '507f1f77bcf86cd799439011',
          type: 'expense',
          amount: 150.50,
          categoryId: '507f1f77bcf86cd799439013',
          walletId: '507f1f77bcf86cd799439014',
          description: 'Grocery shopping at Walmart',
          tags: ['groceries', 'monthly'],
          date: '2024-01-15T10:30:00.000Z',
          isRecurring: false,
          createdAt: '2024-01-15T10:30:00.000Z'
        },
        message: 'Transaction details retrieved successfully'
      }
    }
  },
  headers: {
    'X-Request-Id': {
      $ref: '#/components/headers/XRequestId'
    }
  }
};

/**
 * Success (200) Response - Transaction Statistics
 */
const TransactionStatisticsSuccess = {
  description: 'Transaction statistics retrieved successfully',
  content: {
    'application/json': {
      schema: {
        allOf: [
          { $ref: '#/components/schemas/SuccessResponse' },
          {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  totals: {
                    type: 'object'
                  },
                  categoryBreakdown: {
                    type: 'array'
                  },
                  dateStats: {
                    type: 'array'
                  },
                  period: {
                    type: 'object'
                  }
                }
              }
            }
          }
        ]
      },
      example: {
        success: true,
        data: {
          totals: {
            income: {
              count: 500,
              totalAmount: 50000.00
            },
            expense: {
              count: 1000,
              totalAmount: 35000.00
            }
          },
          categoryBreakdown: [
            {
              category: { name: 'Food', color: '#3B82F6' },
              count: 200,
              totalAmount: 5000.00
            }
          ],
          dateStats: [
            { _id: '2024-01-15', count: 50, totalAmount: 2500.00 }
          ],
          period: {
            start: '2024-01-01',
            end: '2024-01-31'
          }
        },
        message: 'Transaction statistics retrieved successfully'
      }
    }
  },
  headers: {
    'X-Request-Id': {
      $ref: '#/components/headers/XRequestId'
    }
  }
};

/**
 * Success (200) Response - System Health
 */
const SystemHealthSuccess = {
  description: 'System health retrieved successfully',
  content: {
    'application/json': {
      schema: {
        allOf: [
          { $ref: '#/components/schemas/SuccessResponse' },
          {
            type: 'object',
            properties: {
              data: {
                $ref: '#/components/schemas/SystemHealth'
              }
            }
          }
        ]
      },
      example: {
        success: true,
        data: {
          status: 'healthy',
          timestamp: '2024-01-15T10:30:00.000Z',
          database: {
            status: 'connected',
            healthy: true
          },
          memory: {
            rss: 256,
            heapTotal: 512,
            heapUsed: 450,
            external: 50,
            usagePercent: 88,
            healthy: true
          },
          uptime: {
            seconds: 86400,
            formatted: '1d 0h 0m 0s'
          },
          environment: 'production',
          version: '1.0.0'
        },
        message: 'System health retrieved successfully'
      }
    }
  },
  headers: {
    'X-Request-Id': {
      $ref: '#/components/headers/XRequestId'
    }
  }
};

/**
 * Success (200) Response - System Metrics
 */
const SystemMetricsSuccess = {
  description: 'System metrics retrieved successfully',
  content: {
    'application/json': {
      schema: {
        allOf: [
          { $ref: '#/components/schemas/SuccessResponse' },
          {
            type: 'object',
            properties: {
              data: {
                $ref: '#/components/schemas/SystemMetrics'
              }
            }
          }
        ]
      },
      example: {
        success: true,
        data: {
          performance: {
            responseTime: '45.23ms',
            cpuUsage: '12.50%'
          },
          requests: {
            total: 150000,
            errors: 150,
            errorRate: '0.10%'
          },
          connections: {
            database: 'connected'
          },
          system: {
            nodeVersion: 'v18.17.0',
            platform: 'linux',
            arch: 'x64',
            pid: 12345
          },
          timestamp: '2024-01-15T10:30:00.000Z'
        },
        message: 'System metrics retrieved successfully'
      }
    }
  },
  headers: {
    'X-Request-Id': {
      $ref: '#/components/headers/XRequestId'
    }
  }
};

/**
 * Success (200) Response - Summary Report
 */
const SummaryReportSuccess = {
  description: 'Summary report generated successfully',
  content: {
    'application/json': {
      schema: {
        allOf: [
          { $ref: '#/components/schemas/SuccessResponse' },
          {
            type: 'object',
            properties: {
              data: {
                $ref: '#/components/schemas/ReportSummary'
              }
            }
          }
        ]
      },
      example: {
        success: true,
        data: {
          userCount: 1250,
          verifiedUsers: 980,
          transactionCount: 15420,
          totalTransactionAmount: 1250000.50,
          period: {
            start: '2024-01-01',
            end: '2024-12-31'
          },
          generatedAt: '2024-01-15T10:30:00.000Z'
        },
        message: 'Summary report generated successfully'
      }
    }
  },
  headers: {
    'X-Request-Id': {
      $ref: '#/components/headers/XRequestId'
    }
  }
};

/**
 * Success (200) Response - Detailed Report
 */
const DetailedReportSuccess = {
  description: 'Detailed report generated successfully',
  content: {
    'application/json': {
      schema: {
        allOf: [
          { $ref: '#/components/schemas/SuccessResponse' },
          {
            type: 'object',
            properties: {
              data: {
                $ref: '#/components/schemas/ReportDetailed'
              }
            }
          }
        ]
      },
      example: {
        success: true,
        data: {
          userGrowth: [
            { _id: '2024-01-14', count: 12 },
            { _id: '2024-01-15', count: 15 }
          ],
          transactionTrends: [
            { _id: '2024-01-14', count: 145, totalAmount: 12000.00 },
            { _id: '2024-01-15', count: 150, totalAmount: 12500.50 }
          ],
          topUsers: [
            {
              userId: '507f1f77bcf86cd799439011',
              username: 'johndoe',
              email: 'john@example.com',
              count: 50,
              totalAmount: 5000.00
            }
          ],
          period: {
            start: '2024-01-01',
            end: '2024-12-31'
          },
          generatedAt: '2024-01-15T10:30:00.000Z'
        },
        message: 'Detailed report generated successfully'
      }
    }
  },
  headers: {
    'X-Request-Id': {
      $ref: '#/components/headers/XRequestId'
    }
  }
};

// Export all responses
const responses = {
  BadRequest,
  Unauthorized,
  Forbidden,
  NotFound,
  Conflict,
  TooManyRequests,
  InternalServerError,
  ServiceUnavailable,
  DashboardOverviewSuccess,
  DashboardStatisticsSuccess,
  UserListSuccess,
  UserDetailSuccess,
  UserCreatedSuccess,
  UserUpdatedSuccess,
  UserDeletedSuccess,
  TransactionListSuccess,
  TransactionDetailSuccess,
  TransactionStatisticsSuccess,
  SystemHealthSuccess,
  SystemMetricsSuccess,
  SummaryReportSuccess,
  DetailedReportSuccess
};

module.exports = { responses };
