# CoinDrop Financial Management System - UML Diagrams

This directory contains all UML diagrams for the CoinDrop Financial Management System thesis, organized by diagram type.

## Directory Structure

```
thesis_uml_diagrams/
├── use_cases/         # User interaction and system functionality diagrams
├── class_diagrams/    # System structure and relationships
├── sequence_diagrams/ # Component interactions and message flow
├── activity_diagrams/ # System workflows and processes
└── database_schemas/  # Database structure and relationships
```

## Diagram Index

### Use Case Diagrams
1. [User Authentication](use_cases/user_authentication.md) - System authentication flows
2. [Wallet Management](use_cases/wallet_management.md) - Wallet operations
3. [Transaction Management](use_cases/transaction_management.md) - Transaction handling
4. [Budget Management](use_cases/budget_management.md) - Budget operations
5. [Savings Management](use_cases/savings_management.md) - Savings goals and tracking

### Class Diagrams
1. [Core Domain Model](class_diagrams/core_domain_model.md) - Main system entities
2. [Service Layer](class_diagrams/service_layer.md) - Business logic services
3. [Repository Layer](class_diagrams/repository_layer.md) - Data access layer
4. [Controller Layer](class_diagrams/controller_layer.md) - API endpoints

### Sequence Diagrams
1. [User Registration](sequence_diagrams/user_registration.md) - New user registration flow
2. [Transaction Creation](sequence_diagrams/transaction_creation.md) - Transaction processing
3. [Budget Creation](sequence_diagrams/budget_creation.md) - Budget setup process
4. [Savings Goal Tracking](sequence_diagrams/savings_goal_tracking.md) - Savings monitoring

### Activity Diagrams
1. [User Onboarding](activity_diagrams/user_onboarding.md) - New user setup process
2. [Transaction Processing](activity_diagrams/transaction_processing.md) - Transaction workflow
3. [Budget Analysis](activity_diagrams/budget_analysis.md) - Budget monitoring process
4. [Savings Goal Achievement](activity_diagrams/savings_goal_achievement.md) - Savings tracking

### Database Schemas
1. [User Schema](database_schemas/user_schema.md) - User data structure
2. [Wallet Schema](database_schemas/wallet_schema.md) - Wallet data structure
3. [Transaction Schema](database_schemas/transaction_schema.md) - Transaction data structure
4. [Budget Schema](database_schemas/budget_schema.md) - Budget data structure
5. [Savings Schema](database_schemas/savings_schema.md) - Savings data structure

## Usage

Each diagram file contains:
1. A detailed description of the diagram's purpose
2. Key elements and their relationships
3. System context and relevance to the thesis
4. Mermaid.js code for rendering the diagram

To view these diagrams:
1. Use a Markdown viewer that supports Mermaid.js (e.g., VS Code with Mermaid extension)
2. View on GitHub, which natively supports Mermaid.js
3. Use the Mermaid Live Editor (https://mermaid.live)
