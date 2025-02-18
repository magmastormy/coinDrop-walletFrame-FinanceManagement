# Service Layer Class Diagram

## Description

**Purpose**: This diagram illustrates the service layer architecture of the CoinDrop system, showing how frontend components connect to backend services through managers and APIs. It demonstrates the complete flow from UI components through managers to backend services.

**Key Elements**:
- Frontend Managers: Core component managers
- API Services: Frontend service layer
- Backend Controllers: API endpoints
- Backend Services: Business logic
- Data Transfer Objects (DTOs)

**System Context**: This diagram is crucial to Section 3.8 of the thesis, which details the system's service layer architecture and the integration between frontend and backend components.

## Mermaid Code

```mermaid
classDiagram
    %% Frontend Manager Components
    class BaseManager {
        <<abstract>>
        #apiService: ApiService
        #store: Store
        +initialize()
        +handleError(error)
        #dispatch(action)
        #select(selector)
    }

    class WalletManager {
        -walletService: WalletApiService
        +createWallet(data)
        +updateWallet(id, data)
        +deleteWallet(id)
        +getWallets()
        +getWalletBalance(id)
        +handleTransaction(txData)
    }

    class TransactionManager {
        -transactionService: TransactionApiService
        +createTransaction(data)
        +updateTransaction(id, data)
        +deleteTransaction(id)
        +getTransactions(filters)
        +generateReport(criteria)
        +categorizeTransaction(id, category)
    }

    class BudgetManager {
        -budgetService: BudgetApiService
        +createBudget(data)
        +updateBudget(id, data)
        +deleteBudget(id)
        +getBudgets()
        +trackSpending(budgetId)
        +generateAlerts()
    }

    class SavingsManager {
        -savingsService: SavingsApiService
        +createGoal(data)
        +updateGoal(id, data)
        +deleteGoal(id)
        +getGoals()
        +trackProgress(goalId)
        +calculateProjections()
    }

    %% Frontend API Services
    class ApiService {
        <<abstract>>
        #axios: AxiosInstance
        #baseURL: string
        +get(url, config)
        +post(url, data, config)
        +put(url, data, config)
        +delete(url, config)
        #handleResponse(response)
        #handleError(error)
    }

    class WalletApiService {
        +getWallets()
        +getWallet(id)
        +createWallet(data)
        +updateWallet(id, data)
        +deleteWallet(id)
    }

    class TransactionApiService {
        +getTransactions(filters)
        +getTransaction(id)
        +createTransaction(data)
        +updateTransaction(id, data)
        +deleteTransaction(id)
    }

    class BudgetApiService {
        +getBudgets()
        +getBudget(id)
        +createBudget(data)
        +updateBudget(id, data)
        +deleteBudget(id)
    }

    class SavingsApiService {
        +getGoals()
        +getGoal(id)
        +createGoal(data)
        +updateGoal(id, data)
        +deleteGoal(id)
    }

    %% Backend Controllers
    class BaseController {
        <<abstract>>
        #service: BaseService
        +handleRequest(req, res)
        #sendResponse(res, data)
        #handleError(res, error)
    }

    class WalletController {
        -walletService: WalletService
        +getWallets(req, res)
        +getWallet(req, res)
        +createWallet(req, res)
        +updateWallet(req, res)
        +deleteWallet(req, res)
    }

    class TransactionController {
        -transactionService: TransactionService
        +getTransactions(req, res)
        +getTransaction(req, res)
        +createTransaction(req, res)
        +updateTransaction(req, res)
        +deleteTransaction(req, res)
    }

    %% Backend Services
    class BaseService {
        <<abstract>>
        #repository: Repository
        +create(data)
        +update(id, data)
        +delete(id)
        +findById(id)
        +findAll(criteria)
    }

    class WalletService {
        -walletRepo: WalletRepository
        +createWallet(data)
        +updateWallet(id, data)
        +deleteWallet(id)
        +getWalletBalance(id)
        +processTransaction(txData)
    }

    class TransactionService {
        -transactionRepo: TransactionRepository
        +createTransaction(data)
        +updateTransaction(id, data)
        +deleteTransaction(id)
        +getTransactions(filters)
        +generateReport(criteria)
    }

    %% Relationships
    BaseManager <|-- WalletManager
    BaseManager <|-- TransactionManager
    BaseManager <|-- BudgetManager
    BaseManager <|-- SavingsManager

    ApiService <|-- WalletApiService
    ApiService <|-- TransactionApiService
    ApiService <|-- BudgetApiService
    ApiService <|-- SavingsApiService

    BaseController <|-- WalletController
    BaseController <|-- TransactionController

    BaseService <|-- WalletService
    BaseService <|-- TransactionService

    WalletManager --> WalletApiService
    TransactionManager --> TransactionApiService
    BudgetManager --> BudgetApiService
    SavingsManager --> SavingsApiService

    WalletApiService --> WalletController
    TransactionApiService --> TransactionController

    WalletController --> WalletService
    TransactionController --> TransactionService
```

## Component Descriptions

1. **Frontend Managers**
   - Abstract BaseManager with common functionality
   - Specialized managers for each domain
   - State management integration
   - Error handling

2. **API Services**
   - Abstract ApiService with HTTP methods
   - Domain-specific API services
   - Request/response handling
   - Error handling

3. **Backend Controllers**
   - Request handling and validation
   - Service coordination
   - Response formatting
   - Error handling

4. **Backend Services**
   - Business logic implementation
   - Data access coordination
   - Transaction management
   - Domain rules enforcement

## Integration Points

1. **Frontend to API**
   - Managers use API services
   - API services handle HTTP communication
   - DTOs for data transfer
   - Error handling and retries

2. **API to Backend**
   - Controllers receive requests
   - Services process business logic
   - Repositories handle data access
   - Error propagation

3. **Cross-Cutting Concerns**
   - Authentication
   - Error handling
   - Logging
   - Validation

## Data Flow

1. **Request Flow**
   ```
   UI Component → Manager → API Service → Controller → Service → Repository → Database
   ```

2. **Response Flow**
   ```
   Database → Repository → Service → Controller → API Service → Manager → UI Component
   ```

3. **Error Flow**
   ```
   Error Source → Error Handler → API Response → Manager → UI Error Display
   ```

## Design Patterns

1. **Manager Pattern**
   - Centralized component management
   - State coordination
   - Event handling
   - UI updates

2. **Service Pattern**
   - Business logic encapsulation
   - Data access abstraction
   - Transaction management
   - Error handling

3. **Repository Pattern**
   - Data access abstraction
   - Query optimization
   - Caching
   - Data mapping
