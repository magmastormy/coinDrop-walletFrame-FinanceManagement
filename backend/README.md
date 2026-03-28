# CoinDrop Backend Architecture

## Overview

CoinDrop is a comprehensive financial management application with a robust backend architecture designed for scalability, security, and performance. This document provides an overview of the backend architecture, including its components, structure, and key features.

## Architecture Diagram

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client Apps   │────│  API Gateway    │────│  Backend Server │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                  │
                                                  ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   MongoDB       │────│  Controllers    │────│  Services       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                  │
                                                  ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Redis         │────│  Middleware     │────│  Utils          │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                  │
                                                  ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Cloudinary    │────│  Models         │────│  AI Services    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Directory Structure

```
backend/
├── ai/                 # AI-related modules
├── config/             # Configuration files
├── controllers/        # Request handlers
├── middleware/         # Middleware functions
├── models/             # Mongoose models
├── routes/             # API routes
├── seeders/            # Database seeders
├── services/           # Business logic services
├── utils/              # Utility functions
├── app.js              # Express app setup
├── server.js           # Server entry point
├── package.json        # Project dependencies
└── README.md           # This documentation
```

## Core Components

### 1. Controllers

Controllers handle incoming HTTP requests, validate input, and return responses. They act as the entry point for API requests and delegate business logic to services.

**Key Controllers:**
- `authController.js` - Authentication and user management
- `transactionController.js` - Transaction management
- `categoryController.js` - Category management
- `savingsAccountController.js` - Savings account management
- `analyticsController.js` - Financial analytics

### 2. Services

Services contain the core business logic and interact with data models. They provide a layer of abstraction between controllers and data access.

**Key Services:**
- `transactionService.js` - Transaction processing
- `categoryService.js` - Category management and AI classification
- `savingsRuleExecutor.js` - Automated savings rule execution
- `financialAnalyzerService.js` - Financial data analysis
- `aiClient.js` - AI model integration

### 3. Models

Models define the data structure and interactions with the MongoDB database. They use Mongoose for object modeling.

**Key Models:**
- `User.js` - User information and authentication
- `Transaction.js` - Financial transactions
- `Category.js` - Expense categories
- `SavingsAccount.js` - Savings accounts
- `Wallet.js` - User wallets

### 4. Middleware

Middleware functions process requests before they reach controllers. They handle authentication, validation, and other cross-cutting concerns.

**Key Middleware:**
- `authMiddleware.js` - JWT authentication
- `validationMiddleware.js` - Input validation
- `rateLimitingMiddleware.js` - Request rate limiting
- `auditMiddleware.js` - Activity auditing

### 5. Utils

Utility functions provide common functionality used across the application.

**Key Utils:**
- `errorHandler.js` - Error handling
- `logger.js` - Logging
- `encryption.js` - Data encryption
- `dateUtils.js` - Date manipulation
- `validator.js` - Input validation

### 6. AI Services

AI services enhance the application with intelligent features like automatic transaction categorization and financial insights.

**Key AI Components:**
- `categoryAIModel.js` - AI model for transaction categorization
- `categoryAIService.js` - Service for AI-powered categorization
- `questionAnalyzer.js` - Natural language processing for user queries

## API Documentation

API documentation is generated using Swagger. The documentation is available at `/api-docs` when the server is running.

### Key API Endpoints

- **Authentication:** `/api/auth/*` - Register, login, token refresh
- **Transactions:** `/api/transactions/*` - Create, read, update, delete transactions
- **Categories:** `/api/categories/*` - Manage expense categories
- **Savings:** `/api/savings/*` - Savings accounts and goals
- **Analytics:** `/api/analytics/*` - Financial analytics and reports
- **Profile:** `/api/profile/*` - User profile management

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting to prevent brute force attacks
- Input validation and sanitization
- Transaction validation
- Secure error handling
- Audit logging

## Performance Optimizations

- Redis caching
- Database indexing
- Batch processing for large operations
- Connection pooling
- Circuit breaker pattern for external service calls
- Auto-scaling capabilities

## Deployment

The backend is designed for deployment in containerized environments. It supports:

- Environment-based configuration
- Multiple instance scaling
- Health checks
- Monitoring integration

### Production Deployment

1. **Environment Configuration**
   - Create a `.env` file with production values (see `.env.test` for reference)
   - Set environment variables in your deployment platform

2. **Containerization**
   - The application is containerized using Docker
   - Build the Docker image: `docker build -t coindrop:latest .`
   - Push to a container registry: `docker push <registry>/coindrop:latest`

3. **Infrastructure Setup**
   - The project uses Terraform for infrastructure as code
   - Run `terraform init` and `terraform apply` to provision AWS resources
   - Resources include VPC, ECS cluster, load balancer, and security groups

4. **CI/CD Pipeline**
   - GitHub Actions workflow for CI/CD
   - Automatically runs tests, builds, and deploys to production
   - Deploys to AWS ECS when pushing to main/master branch

### Monitoring

1. **CloudWatch Integration**
   - Logs are sent to CloudWatch Logs
   - Log groups: `/ecs/coindrop`
   - Log streams for application logs, exceptions, and rejections
   - Retention period: 14 days

2. **Metrics Collection**
   - Custom metrics for API requests, database queries, and system resources
   - Metrics are exposed in Prometheus format
   - Health check endpoint: `/api/health`

3. **Alerting**
   - Set up CloudWatch Alarms for critical metrics
   - Monitor error rates, response times, and resource utilization

### Scaling

1. **Auto-scaling**
   - ECS service with auto-scaling based on CPU utilization
   - Minimum 1 instance, maximum 10 instances
   - Scaling policies configured in Terraform

2. **Load Balancing**
   - Application Load Balancer for distributing traffic
   - Health checks to ensure only healthy instances receive traffic
   - HTTPS support with SSL certificate

### Security

1. **Production Security**
   - Use IAM roles for AWS resource access
   - Configure security groups to restrict access
   - Enable HTTPS for all communications
   - Regular security audits

2. **Secrets Management**
   - Use environment variables or AWS Secrets Manager for sensitive information
   - Never commit secrets to version control


## Development

### Prerequisites
- Node.js 14+
- MongoDB 4.4+
- Redis (optional, for caching)

### Installation
1. Clone the repository
2. Install dependencies: `npm install`
3. Configure environment variables in `.env`
4. Start the server: `npm run dev`

### Testing
- Run tests: `npm test`
- Run tests with coverage: `npm run test:coverage`

## Monitoring

The application includes monitoring features:

- Logging with Winston
- Metrics collection
- Connection pool monitoring
- Health check endpoints

## Conclusion

The CoinDrop backend architecture is designed for scalability, security, and maintainability. It follows best practices in software engineering and provides a solid foundation for building a robust financial management application.
