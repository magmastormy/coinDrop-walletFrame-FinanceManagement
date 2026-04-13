/**
 * Swagger/OpenAPI Configuration
 * 
 * This module configures Swagger UI and OpenAPI 3.0.0 specification
 * for the CoinDrop API documentation.
 * 
 * @module config/swagger
 */

const swaggerJSDoc = require('swagger-jsdoc');

// Import documentation components
const { schemas } = require('../docs/schemas');
const { responses } = require('../docs/responses');
const { adminApiPaths } = require('../docs/admin-api-docs');

/**
 * OpenAPI 3.0.0 Specification Definition
 */
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'CoinDrop API',
    version: '1.0.0',
    description: `
# CoinDrop Financial Management API

Welcome to the CoinDrop API documentation. This API provides comprehensive endpoints for managing personal finances including transactions, budgets, savings goals, and administrative functions.

## Base URL

- **Development**: http://localhost:3001
- **Production**: https://api.coindrop.com

## Authentication

All API endpoints (except authentication endpoints) require a valid JWT token passed in the Authorization header:

\`\`\`
Authorization: Bearer <your-jwt-token>
\`\`\`

## Rate Limiting

API requests are rate-limited to ensure fair usage:

- **General API**: 300 requests per 15 minutes
- **AI Endpoints**: 20 requests per minute
- **Financial Operations**: 10 requests per minute
- **Admin Write Operations**: 30 requests per 15 minutes

## Response Format

All responses follow a consistent format:

\`\`\`json
{
  "success": true|false,
  "data": { ... },
  "message": "Human-readable message",
  "pagination": { ... } // Only for paginated responses
}
\`\`\`

## Error Handling

Errors follow the RFC 7807 Problem Details format with additional application-specific fields:

\`\`\`json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": [ ... ], // Validation errors
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
\`\`\`

## Support

For API support, please contact: api-support@coindrop.com
    `,
    contact: {
      name: 'CoinDrop API Support',
      email: 'api-support@coindrop.com',
      url: 'https://coindrop.com/support'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    }
  },
  servers: [
    {
      url: process.env.API_BASE_URL || 'http://localhost:3001',
      description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server'
    },
    {
      url: 'http://localhost:3001',
      description: 'Local development server'
    }
  ],
  
  /**
   * Security Schemes
   */
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT token in the format: Bearer <token>'
      }
    },
    
    /**
     * Reusable Schemas
     */
    schemas: schemas,
    
    /**
     * Reusable Responses
     */
    responses: responses,
    
    /**
     * Reusable Parameters
     */
    parameters: {
      PageParam: {
        name: 'page',
        in: 'query',
        description: 'Page number for pagination',
        schema: {
          type: 'integer',
          minimum: 1,
          default: 1
        },
        example: 1
      },
      LimitParam: {
        name: 'limit',
        in: 'query',
        description: 'Number of items per page',
        schema: {
          type: 'integer',
          minimum: 1,
          maximum: 100,
          default: 10
        },
        example: 10
      },
      SortByParam: {
        name: 'sortBy',
        in: 'query',
        description: 'Field to sort by',
        schema: {
          type: 'string',
          default: 'createdAt'
        },
        example: 'createdAt'
      },
      SortOrderParam: {
        name: 'sortOrder',
        in: 'query',
        description: 'Sort order direction',
        schema: {
          type: 'string',
          enum: ['asc', 'desc'],
          default: 'desc'
        },
        example: 'desc'
      },
      StartDateParam: {
        name: 'startDate',
        in: 'query',
        description: 'Start date for date range filter (ISO 8601 format)',
        schema: {
          type: 'string',
          format: 'date-time'
        },
        example: '2024-01-01T00:00:00.000Z'
      },
      EndDateParam: {
        name: 'endDate',
        in: 'query',
        description: 'End date for date range filter (ISO 8601 format)',
        schema: {
          type: 'string',
          format: 'date-time'
        },
        example: '2024-12-31T23:59:59.999Z'
      },
      UserIdParam: {
        name: 'userId',
        in: 'query',
        description: 'Filter by user ID',
        schema: {
          type: 'string',
          pattern: '^[0-9a-fA-F]{24}$'
        },
        example: '507f1f77bcf86cd799439011'
      },
      SearchParam: {
        name: 'search',
        in: 'query',
        description: 'Search term for filtering results',
        schema: {
          type: 'string',
          minLength: 1,
          maxLength: 100
        },
        example: 'john doe'
      }
    },
    
    /**
     * Reusable Headers
     */
    headers: {
      XRequestId: {
        description: 'Unique request identifier for tracing',
        schema: {
          type: 'string',
          format: 'uuid'
        },
        example: '550e8400-e29b-41d4-a716-446655440000'
      },
      XRateLimitLimit: {
        description: 'Maximum number of requests allowed in the current window',
        schema: {
          type: 'integer'
        },
        example: 300
      },
      XRateLimitRemaining: {
        description: 'Number of requests remaining in the current window',
        schema: {
          type: 'integer'
        },
        example: 299
      },
      XRateLimitReset: {
        description: 'Unix timestamp when the rate limit window resets',
        schema: {
          type: 'integer'
        },
        example: 1704067200
      }
    }
  },
  
  /**
   * Global Security
   */
  security: [
    {
      BearerAuth: []
    }
  ],
  
  /**
   * API Paths
   */
  paths: {
    // Admin API paths
    ...adminApiPaths
  },
  
  /**
   * Tags for API grouping
   */
  tags: [
    {
      name: 'Authentication',
      description: 'User authentication and authorization endpoints'
    },
    {
      name: 'Dashboard',
      description: 'Admin dashboard overview and statistics'
    },
    {
      name: 'Users',
      description: 'User management operations for administrators'
    },
    {
      name: 'Transactions',
      description: 'Transaction management and reporting'
    },
    {
      name: 'System',
      description: 'System health, metrics, and monitoring'
    },
    {
      name: 'Reports',
      description: 'Report generation and data export'
    },
    {
      name: 'Wallets',
      description: 'Wallet management operations'
    },
    {
      name: 'Categories',
      description: 'Transaction category management'
    },
    {
      name: 'Budgets',
      description: 'Budget planning and tracking'
    },
    {
      name: 'Savings Goals',
      description: 'Savings goal management'
    }
  ]
};

/**
 * Swagger JSDoc Options
 */
const options = {
  swaggerDefinition,
  apis: [
    './routes/*.js',
    './controllers/*.js',
    './docs/*.js'
  ]
};

/**
 * Generate Swagger Specification
 */
const swaggerSpec = swaggerJSDoc(options);

/**
 * Swagger UI Options
 */
const swaggerUiOptions = {
  explorer: true,
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info .title { color: #3B82F6 }
    .swagger-ui .opblock .opblock-summary-method { font-weight: bold }
    .swagger-ui .opblock.opblock-get { border-color: #3B82F6; background: rgba(59, 130, 246, 0.05) }
    .swagger-ui .opblock.opblock-post { border-color: #10B981; background: rgba(16, 185, 129, 0.05) }
    .swagger-ui .opblock.opblock-put { border-color: #F59E0B; background: rgba(245, 158, 11, 0.05) }
    .swagger-ui .opblock.opblock-delete { border-color: #EF4444; background: rgba(239, 68, 68, 0.05) }
    .swagger-ui .opblock.opblock-patch { border-color: #8B5CF6; background: rgba(139, 92, 246, 0.05) }
    .swagger-ui .btn.authorize { background-color: #3B82F6; border-color: #3B82F6 }
    .swagger-ui .btn.authorize svg { fill: white }
  `,
  customSiteTitle: 'CoinDrop API Documentation',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    docExpansion: 'list',
    filter: true,
    showExtensions: true,
    showCommonExtensions: true,
    tryItOutEnabled: true,
    supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch'],
    validatorUrl: null,
    tagsSorter: 'alpha',
    operationsSorter: 'alpha'
  }
};

module.exports = swaggerSpec;
module.exports.swaggerUiOptions = swaggerUiOptions;
module.exports.swaggerDefinition = swaggerDefinition;
