# Transaction Creation Sequence Diagram

## Description

**Purpose**: This diagram illustrates the sequence of interactions between different components of the system during the creation of a new financial transaction. It shows the flow of data and control from the user interface through various system layers to the database.

**Key Elements**:
- Components: Client, API Gateway, Transaction Service, Wallet Service, Database
- Messages: HTTP requests, service calls, database operations
- Validations: Input validation, balance checks, category verification
- Updates: Wallet balance updates, transaction logging

**System Context**: This diagram is crucial to Section 3.5 of the thesis, which details the system's transaction processing capabilities. It demonstrates how the system maintains data consistency and handles concurrent operations.

## Mermaid Code

```mermaid
sequenceDiagram
    participant C as Client
    participant AG as API Gateway
    participant TS as TransactionService
    participant WS as WalletService
    participant CS as CategoryService
    participant DB as Database

    %% Transaction Creation Request
    C->>+AG: POST /api/transactions
    Note over C,AG: Transaction details in request body

    %% API Gateway Authentication
    AG->>AG: Validate JWT token
    
    %% Transaction Service Processing
    AG->>+TS: createTransaction(data)
    
    %% Input Validation
    TS->>TS: validateTransactionData()
    
    %% Category Verification
    TS->>+CS: verifyCategory(categoryId)
    CS->>DB: findCategory()
    DB-->>CS: category
    CS-->>-TS: categoryVerified
    
    %% Wallet Balance Check
    TS->>+WS: checkBalance(walletId, amount)
    WS->>DB: getWalletBalance()
    DB-->>WS: currentBalance
    WS->>WS: validateBalance()
    WS-->>-TS: balanceVerified
    
    %% Transaction Creation
    TS->>DB: beginTransaction()
    
    %% Save Transaction
    TS->>DB: saveTransaction()
    
    %% Update Wallet Balance
    TS->>+WS: updateBalance(walletId, amount)
    WS->>DB: updateWalletBalance()
    DB-->>WS: balanceUpdated
    WS-->>-TS: balanceUpdateConfirmed
    
    %% Commit Transaction
    TS->>DB: commitTransaction()
    
    %% Response
    TS-->>-AG: transactionCreated
    AG-->>-C: 201 Created
    Note over C,AG: Transaction details in response

    %% Error Handling (Alternative Flow)
    Note over C,DB: Error Handling
    alt Insufficient Balance
        WS-->>TS: InsufficientBalanceError
        TS-->>AG: 400 Bad Request
        AG-->>C: Error: Insufficient Balance
    else Invalid Category
        CS-->>TS: InvalidCategoryError
        TS-->>AG: 400 Bad Request
        AG-->>C: Error: Invalid Category
    else Database Error
        DB-->>TS: DatabaseError
        TS->>DB: rollbackTransaction()
        TS-->>AG: 500 Internal Server Error
        AG-->>C: Error: Transaction Failed
    end
```

## Component Interactions

1. **Client to API Gateway**:
   - Client sends transaction creation request
   - Includes transaction details (amount, type, category, etc.)
   - Requires authentication token

2. **API Gateway Processing**:
   - Validates authentication token
   - Routes request to Transaction Service
   - Handles response formatting

3. **Transaction Service**:
   - Validates transaction data
   - Coordinates with other services
   - Manages transaction atomicity
   - Handles error scenarios

4. **Category Service**:
   - Verifies category existence
   - Validates category type
   - Ensures category belongs to user

5. **Wallet Service**:
   - Checks wallet balance
   - Updates wallet balance
   - Ensures atomic updates

6. **Database Operations**:
   - Uses transactions for consistency
   - Handles rollbacks on errors
   - Maintains data integrity

## Error Handling

1. **Validation Errors**:
   - Invalid transaction data
   - Invalid category
   - Insufficient balance

2. **System Errors**:
   - Database failures
   - Service unavailability
   - Network issues

3. **Concurrency Handling**:
   - Transaction isolation
   - Balance update atomicity
   - Deadlock prevention

## Integration Points

This sequence diagram connects with:
- Transaction Management use case
- Core Domain Model class diagram
- Transaction Processing activity diagram
- Database Schema diagram

## Performance Considerations

1. **Optimization**:
   - Minimized database calls
   - Efficient service communication
   - Proper transaction isolation

2. **Scalability**:
   - Stateless service design
   - Independent service scaling
   - Efficient resource usage

3. **Monitoring**:
   - Transaction timing tracking
   - Error rate monitoring
   - Performance metrics collection
