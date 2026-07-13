/**
 * Admin API Documentation
 *
 * This module defines all admin API paths for the OpenAPI specification.
 * These endpoints provide administrative functionality for managing users,
 * transactions, system health, and generating reports.
 *
 * @module docs/admin-api-docs
 */

/**
 * Admin API Paths
 * Comprehensive documentation for all admin endpoints
 */
const adminApiPaths = {
  /**
   * ============================================
   * Dashboard Endpoints
   * ============================================
   */

  /**
   * GET /api/admin/dashboard/overview
   * Get dashboard overview data
   */
  '/api/admin/dashboard/overview': {
    get: {
      summary: 'Get Dashboard Overview',
      description: `
Retrieves a comprehensive overview of the system including total users, active users,
total transactions, total transaction amount, and recent activities.

**Authorization:** Requires admin role

**Rate Limit:** 100 requests per 15 minutes

**Example Use Case:** Admin dashboard landing page to display key metrics at a glance.
      `,
      tags: ['Dashboard'],
      security: [{ BearerAuth: [] }],
      responses: {
        '200': {
          $ref: '#/components/responses/DashboardOverviewSuccess'
        },
        '401': {
          $ref: '#/components/responses/Unauthorized'
        },
        '403': {
          $ref: '#/components/responses/Forbidden'
        },
        '429': {
          $ref: '#/components/responses/TooManyRequests'
        },
        '500': {
          $ref: '#/components/responses/InternalServerError'
        }
      }
    }
  },

  /**
   * GET /api/admin/dashboard/statistics
   * Get dashboard statistics
   */
  '/api/admin/dashboard/statistics': {
    get: {
      summary: 'Get Dashboard Statistics',
      description: `
Retrieves detailed statistics including user growth and transaction stats over the last 30 days.

**Authorization:** Requires admin role

**Rate Limit:** 100 requests per 15 minutes

**Example Use Case:** Displaying charts and graphs on the admin dashboard showing trends over time.
      `,
      tags: ['Dashboard'],
      security: [{ BearerAuth: [] }],
      responses: {
        '200': {
          $ref: '#/components/responses/DashboardStatisticsSuccess'
        },
        '401': {
          $ref: '#/components/responses/Unauthorized'
        },
        '403': {
          $ref: '#/components/responses/Forbidden'
        },
        '429': {
          $ref: '#/components/responses/TooManyRequests'
        },
        '500': {
          $ref: '#/components/responses/InternalServerError'
        }
      }
    }
  },

  /**
   * ============================================
   * User Management Endpoints
   * ============================================
   */

  /**
   * GET /api/admin/users
   * List all users with pagination
   */
  '/api/admin/users': {
    get: {
      summary: 'List All Users',
      description: `
Retrieves a paginated list of all users in the system with optional filtering and sorting.

**Authorization:** Requires admin role

**Rate Limit:** 100 requests per 15 minutes

**Query Parameters:**
- Use pagination to navigate through large user lists
- Filter by role to find admins or regular users
- Filter by verification status
- Search across username, email, first name, and last name
- Sort by any valid user field

**Example Use Case:** Admin user management page with search, filter, and sort capabilities.
      `,
      tags: ['Users'],
      security: [{ BearerAuth: [] }],
      parameters: [
        { $ref: '#/components/parameters/PageParam' },
        { $ref: '#/components/parameters/LimitParam' },
        { $ref: '#/components/parameters/SortByParam' },
        { $ref: '#/components/parameters/SortOrderParam' },
        {
          name: 'role',
          in: 'query',
          description: 'Filter by user role',
          schema: {
            type: 'string',
            enum: ['user', 'admin']
          },
          example: 'user'
        },
        {
          name: 'isVerified',
          in: 'query',
          description: 'Filter by verification status',
          schema: {
            type: 'boolean'
          },
          example: true
        },
        { $ref: '#/components/parameters/SearchParam' }
      ],
      responses: {
        '200': {
          $ref: '#/components/responses/UserListSuccess'
        },
        '400': {
          $ref: '#/components/responses/BadRequest'
        },
        '401': {
          $ref: '#/components/responses/Unauthorized'
        },
        '403': {
          $ref: '#/components/responses/Forbidden'
        },
        '429': {
          $ref: '#/components/responses/TooManyRequests'
        },
        '500': {
          $ref: '#/components/responses/InternalServerError'
        }
      }
    },

    /**
     * POST /api/admin/users
     * Create a new user
     */
    post: {
      summary: 'Create New User',
      description: `
Creates a new user account with the provided details.

**Authorization:** Requires admin role

**Rate Limit:** 30 requests per 15 minutes (strict limit for write operations)

**Validation Rules:**
- Username: 3-20 characters, unique
- Email: Valid email format, unique
- Password: Minimum 8 characters, must contain uppercase, lowercase, number, and special character
- First Name: Required
- Last Name: Required
- Role: Optional, defaults to 'user'
- isVerified: Optional, defaults to false

**Example Use Case:** Admin creating user accounts manually or importing users from another system.
      `,
      tags: ['Users'],
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/UserCreateRequest'
            },
            examples: {
              newUser: {
                summary: 'Create a new user',
                value: {
                  username: 'janedoe',
                  email: 'jane.doe@example.com',
                  password: 'SecurePass123!',
                  firstName: 'Jane',
                  lastName: 'Doe',
                  role: 'user',
                  isVerified: false
                }
              },
              newAdmin: {
                summary: 'Create a new admin user',
                value: {
                  username: 'adminuser',
                  email: 'admin@example.com',
                  password: 'AdminPass123!',
                  firstName: 'Admin',
                  lastName: 'User',
                  role: 'admin',
                  isVerified: true
                }
              }
            }
          }
        }
      },
      responses: {
        '201': {
          $ref: '#/components/responses/UserCreatedSuccess'
        },
        '400': {
          $ref: '#/components/responses/BadRequest'
        },
        '401': {
          $ref: '#/components/responses/Unauthorized'
        },
        '403': {
          $ref: '#/components/responses/Forbidden'
        },
        '409': {
          $ref: '#/components/responses/Conflict'
        },
        '429': {
          $ref: '#/components/responses/TooManyRequests'
        },
        '500': {
          $ref: '#/components/responses/InternalServerError'
        }
      }
    }
  },

  /**
   * GET /api/admin/users/{id}
   * Get detailed user information
   */
  '/api/admin/users/{id}': {
    get: {
      summary: 'Get User Details',
      description: `
Retrieves detailed information about a specific user including their profile,
transaction history, and wallets.

**Authorization:** Requires admin role

**Rate Limit:** 100 requests per 15 minutes

**Path Parameters:**
- id: MongoDB ObjectId of the user

**Response includes:**
- User profile information
- Last 10 transactions
- All associated wallets

**Example Use Case:** Admin viewing a user's complete profile and activity history.
      `,
      tags: ['Users'],
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'User ID (MongoDB ObjectId)',
          schema: {
            type: 'string',
            pattern: '^[0-9a-fA-F]{24}$'
          },
          example: '507f1f77bcf86cd799439011'
        }
      ],
      responses: {
        '200': {
          $ref: '#/components/responses/UserDetailSuccess'
        },
        '400': {
          $ref: '#/components/responses/BadRequest'
        },
        '401': {
          $ref: '#/components/responses/Unauthorized'
        },
        '403': {
          $ref: '#/components/responses/Forbidden'
        },
        '404': {
          $ref: '#/components/responses/NotFound'
        },
        '429': {
          $ref: '#/components/responses/TooManyRequests'
        },
        '500': {
          $ref: '#/components/responses/InternalServerError'
        }
      }
    },

    /**
     * PUT /api/admin/users/{id}
     * Update user information
     */
    put: {
      summary: 'Update User',
      description: `
Updates an existing user's information. Note: Password cannot be updated through this endpoint.

**Authorization:** Requires admin role

**Rate Limit:** 30 requests per 15 minutes (strict limit for write operations)

**Path Parameters:**
- id: MongoDB ObjectId of the user

**Updatable Fields:**
- username (must remain unique)
- email (must remain unique)
- firstName
- lastName
- role
- isVerified
- profilePicture

**Example Use Case:** Admin updating user details, verifying accounts, or changing user roles.
      `,
      tags: ['Users'],
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'User ID (MongoDB ObjectId)',
          schema: {
            type: 'string',
            pattern: '^[0-9a-fA-F]{24}$'
          },
          example: '507f1f77bcf86cd799439011'
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/UserUpdateRequest'
            },
            examples: {
              updateRole: {
                summary: 'Update user role',
                value: {
                  role: 'admin'
                }
              },
              verifyUser: {
                summary: 'Verify user account',
                value: {
                  isVerified: true
                }
              },
              updateProfile: {
                summary: 'Update user profile',
                value: {
                  firstName: 'Johnny',
                  lastName: 'Smith',
                  email: 'johnny.smith@example.com'
                }
              }
            }
          }
        }
      },
      responses: {
        '200': {
          $ref: '#/components/responses/UserUpdatedSuccess'
        },
        '400': {
          $ref: '#/components/responses/BadRequest'
        },
        '401': {
          $ref: '#/components/responses/Unauthorized'
        },
        '403': {
          $ref: '#/components/responses/Forbidden'
        },
        '404': {
          $ref: '#/components/responses/NotFound'
        },
        '409': {
          $ref: '#/components/responses/Conflict'
        },
        '429': {
          $ref: '#/components/responses/TooManyRequests'
        },
        '500': {
          $ref: '#/components/responses/InternalServerError'
        }
      }
    },

    /**
     * DELETE /api/admin/users/{id}
     * Delete a user
     */
    delete: {
      summary: 'Delete User',
      description: `
Performs a soft delete on a user account. The user is marked as deleted but data is preserved.

**Authorization:** Requires admin role

**Rate Limit:** 30 requests per 15 minutes (strict limit for write operations)

**Path Parameters:**
- id: MongoDB ObjectId of the user

**Soft Delete Behavior:**
- User is marked with isDeleted: true
- deletedAt timestamp is recorded
- deletedBy records the admin who performed the action
- User data is preserved for audit and recovery purposes

**Example Use Case:** Admin removing a user account while maintaining data integrity for reporting.
      `,
      tags: ['Users'],
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'User ID (MongoDB ObjectId)',
          schema: {
            type: 'string',
            pattern: '^[0-9a-fA-F]{24}$'
          },
          example: '507f1f77bcf86cd799439011'
        }
      ],
      responses: {
        '200': {
          $ref: '#/components/responses/UserDeletedSuccess'
        },
        '400': {
          $ref: '#/components/responses/BadRequest'
        },
        '401': {
          $ref: '#/components/responses/Unauthorized'
        },
        '403': {
          $ref: '#/components/responses/Forbidden'
        },
        '404': {
          $ref: '#/components/responses/NotFound'
        },
        '429': {
          $ref: '#/components/responses/TooManyRequests'
        },
        '500': {
          $ref: '#/components/responses/InternalServerError'
        }
      }
    }
  },

  /**
   * ============================================
   * Transaction Management Endpoints
   * ============================================
   */

  /**
   * GET /api/admin/transactions
   * List all transactions with filters
   */
  '/api/admin/transactions': {
    get: {
      summary: 'List All Transactions',
      description: `
Retrieves a paginated list of all transactions with comprehensive filtering options.

**Authorization:** Requires admin role

**Rate Limit:** 100 requests per 15 minutes

**Query Parameters:**
- Pagination: page, limit
- Type filter: income or expense
- User filter: Filter by specific user
- Date range: startDate, endDate
- Category filter: Filter by category ID
- Sorting: sortBy, sortOrder

**Example Use Case:** Admin reviewing all transactions, investigating issues, or generating custom reports.
      `,
      tags: ['Transactions'],
      security: [{ BearerAuth: [] }],
      parameters: [
        { $ref: '#/components/parameters/PageParam' },
        { $ref: '#/components/parameters/LimitParam' },
        { $ref: '#/components/parameters/SortByParam' },
        { $ref: '#/components/parameters/SortOrderParam' },
        {
          name: 'type',
          in: 'query',
          description: 'Filter by transaction type',
          schema: {
            type: 'string',
            enum: ['income', 'expense']
          },
          example: 'expense'
        },
        { $ref: '#/components/parameters/UserIdParam' },
        { $ref: '#/components/parameters/StartDateParam' },
        { $ref: '#/components/parameters/EndDateParam' },
        {
          name: 'category',
          in: 'query',
          description: 'Filter by category ID',
          schema: {
            type: 'string',
            pattern: '^[0-9a-fA-F]{24}$'
          },
          example: '507f1f77bcf86cd799439013'
        }
      ],
      responses: {
        '200': {
          $ref: '#/components/responses/TransactionListSuccess'
        },
        '400': {
          $ref: '#/components/responses/BadRequest'
        },
        '401': {
          $ref: '#/components/responses/Unauthorized'
        },
        '403': {
          $ref: '#/components/responses/Forbidden'
        },
        '429': {
          $ref: '#/components/responses/TooManyRequests'
        },
        '500': {
          $ref: '#/components/responses/InternalServerError'
        }
      }
    }
  },

  /**
   * GET /api/admin/transactions/{id}
   * Get detailed transaction information
   */
  '/api/admin/transactions/{id}': {
    get: {
      summary: 'Get Transaction Details',
      description: `
Retrieves detailed information about a specific transaction including all related entities.

**Authorization:** Requires admin role

**Rate Limit:** 100 requests per 15 minutes

**Path Parameters:**
- id: MongoDB ObjectId of the transaction

**Response includes:**
- Transaction details
- User information
- Category details
- Wallet information
- Source/destination wallets for transfers

**Example Use Case:** Admin investigating a specific transaction or responding to user inquiries.
      `,
      tags: ['Transactions'],
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'Transaction ID (MongoDB ObjectId)',
          schema: {
            type: 'string',
            pattern: '^[0-9a-fA-F]{24}$'
          },
          example: '507f1f77bcf86cd799439012'
        }
      ],
      responses: {
        '200': {
          $ref: '#/components/responses/TransactionDetailSuccess'
        },
        '400': {
          $ref: '#/components/responses/BadRequest'
        },
        '401': {
          $ref: '#/components/responses/Unauthorized'
        },
        '403': {
          $ref: '#/components/responses/Forbidden'
        },
        '404': {
          $ref: '#/components/responses/NotFound'
        },
        '429': {
          $ref: '#/components/responses/TooManyRequests'
        },
        '500': {
          $ref: '#/components/responses/InternalServerError'
        }
      }
    }
  },

  /**
   * GET /api/admin/transactions/statistics
   * Get transaction statistics
   */
  '/api/admin/transactions/statistics': {
    get: {
      summary: 'Get Transaction Statistics',
      description: `
Retrieves comprehensive transaction statistics including totals by type, category breakdown, and daily trends.

**Authorization:** Requires admin role

**Rate Limit:** 100 requests per 15 minutes

**Query Parameters:**
- Date range: startDate, endDate
- User filter: Filter statistics for a specific user

**Response includes:**
- Totals by transaction type (income/expense)
- Category breakdown with counts and amounts
- Daily statistics with counts and amounts
- Period information

**Example Use Case:** Admin dashboard analytics, financial reporting, and trend analysis.
      `,
      tags: ['Transactions'],
      security: [{ BearerAuth: [] }],
      parameters: [
        { $ref: '#/components/parameters/StartDateParam' },
        { $ref: '#/components/parameters/EndDateParam' },
        { $ref: '#/components/parameters/UserIdParam' }
      ],
      responses: {
        '200': {
          $ref: '#/components/responses/TransactionStatisticsSuccess'
        },
        '400': {
          $ref: '#/components/responses/BadRequest'
        },
        '401': {
          $ref: '#/components/responses/Unauthorized'
        },
        '403': {
          $ref: '#/components/responses/Forbidden'
        },
        '429': {
          $ref: '#/components/responses/TooManyRequests'
        },
        '500': {
          $ref: '#/components/responses/InternalServerError'
        }
      }
    }
  },

  /**
   * ============================================
   * System Endpoints
   * ============================================
   */

  /**
   * GET /api/admin/system/health
   * Get system health status
   */
  '/api/admin/system/health': {
    get: {
      summary: 'Get System Health',
      description: `
Retrieves the current health status of the system including database connection, memory usage, and uptime.

**Authorization:** Requires admin role

**Rate Limit:** 100 requests per 15 minutes

**Health Status Values:**
- healthy: All systems operational
- degraded: Some non-critical issues detected
- unhealthy: Critical issues requiring attention

**Response includes:**
- Overall health status
- Database connection status
- Memory usage metrics
- System uptime
- Environment and version information

**Example Use Case:** System monitoring dashboards, alerting systems, and health checks.
      `,
      tags: ['System'],
      security: [{ BearerAuth: [] }],
      responses: {
        '200': {
          $ref: '#/components/responses/SystemHealthSuccess'
        },
        '401': {
          $ref: '#/components/responses/Unauthorized'
        },
        '403': {
          $ref: '#/components/responses/Forbidden'
        },
        '429': {
          $ref: '#/components/responses/TooManyRequests'
        },
        '500': {
          $ref: '#/components/responses/InternalServerError'
        }
      }
    }
  },

  /**
   * GET /api/admin/system/metrics
   * Get system metrics
   */
  '/api/admin/system/metrics': {
    get: {
      summary: 'Get System Metrics',
      description: `
Retrieves detailed performance metrics for the system including response times, request counts, and resource usage.

**Authorization:** Requires admin role

**Rate Limit:** 100 requests per 15 minutes

**Response includes:**
- Performance metrics (response time, CPU usage)
- Request statistics (total, errors, error rate)
- Connection status
- System information (Node version, platform, etc.)

**Example Use Case:** Performance monitoring, capacity planning, and troubleshooting.
      `,
      tags: ['System'],
      security: [{ BearerAuth: [] }],
      responses: {
        '200': {
          $ref: '#/components/responses/SystemMetricsSuccess'
        },
        '401': {
          $ref: '#/components/responses/Unauthorized'
        },
        '403': {
          $ref: '#/components/responses/Forbidden'
        },
        '429': {
          $ref: '#/components/responses/TooManyRequests'
        },
        '500': {
          $ref: '#/components/responses/InternalServerError'
        }
      }
    }
  },

  /**
   * ============================================
   * Report Endpoints
   * ============================================
   */

  /**
   * GET /api/admin/reports/summary
   * Get summary report
   */
  '/api/admin/reports/summary': {
    get: {
      summary: 'Get Summary Report',
      description: `
Generates a summary report with key metrics including user counts, transaction counts, and total amounts.

**Authorization:** Requires admin role

**Rate Limit:** 100 requests per 15 minutes

**Query Parameters:**
- Date range: startDate, endDate (optional, defaults to all time)

**Response includes:**
- Total user count
- Verified user count
- Total transaction count
- Total transaction amount
- Report period
- Generation timestamp

**Example Use Case:** Executive dashboards, weekly/monthly summary emails, and quick status reports.
      `,
      tags: ['Reports'],
      security: [{ BearerAuth: [] }],
      parameters: [
        { $ref: '#/components/parameters/StartDateParam' },
        { $ref: '#/components/parameters/EndDateParam' }
      ],
      responses: {
        '200': {
          $ref: '#/components/responses/SummaryReportSuccess'
        },
        '400': {
          $ref: '#/components/responses/BadRequest'
        },
        '401': {
          $ref: '#/components/responses/Unauthorized'
        },
        '403': {
          $ref: '#/components/responses/Forbidden'
        },
        '429': {
          $ref: '#/components/responses/TooManyRequests'
        },
        '500': {
          $ref: '#/components/responses/InternalServerError'
        }
      }
    }
  },

  /**
   * GET /api/admin/reports/detailed
   * Get detailed report
   */
  '/api/admin/reports/detailed': {
    get: {
      summary: 'Get Detailed Report',
      description: `
Generates a detailed report with comprehensive analytics including user growth, transaction trends, and top users.

**Authorization:** Requires admin role

**Rate Limit:** 100 requests per 15 minutes

**Query Parameters:**
- Date range: startDate, endDate (optional, defaults to all time)

**Response includes:**
- Daily user growth statistics
- Daily transaction trends (count and amount)
- Top 10 users by transaction count
- Report period
- Generation timestamp

**Example Use Case:** In-depth analytics, board presentations, and strategic planning.
      `,
      tags: ['Reports'],
      security: [{ BearerAuth: [] }],
      parameters: [
        { $ref: '#/components/parameters/StartDateParam' },
        { $ref: '#/components/parameters/EndDateParam' }
      ],
      responses: {
        '200': {
          $ref: '#/components/responses/DetailedReportSuccess'
        },
        '400': {
          $ref: '#/components/responses/BadRequest'
        },
        '401': {
          $ref: '#/components/responses/Unauthorized'
        },
        '403': {
          $ref: '#/components/responses/Forbidden'
        },
        '429': {
          $ref: '#/components/responses/TooManyRequests'
        },
        '500': {
          $ref: '#/components/responses/InternalServerError'
        }
      }
    }
  }
};

module.exports = { adminApiPaths };
