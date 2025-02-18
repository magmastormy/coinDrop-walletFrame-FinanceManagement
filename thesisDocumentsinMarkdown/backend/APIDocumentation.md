# CoinDrop API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication

### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "name": "string",
  "email": "string",
  "password": "string"
}

Response: 201 Created
{
  "token": "string",
  "user": {
    "id": "string",
    "name": "string",
    "email": "string"
  }
}
```

### Login User
```http
POST /auth/login
Content-Type: application/json

{
  "email": "string",
  "password": "string"
}

Response: 200 OK
{
  "token": "string",
  "user": {
    "id": "string",
    "name": "string",
    "email": "string"
  }
}
```

## Wallet Management

### Create Wallet
```http
POST /wallets
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "string",
  "type": "string",
  "currency": "string",
  "initialBalance": "number"
}

Response: 201 Created
{
  "id": "string",
  "name": "string",
  "type": "string",
  "balance": "number",
  "currency": "string"
}
```

### Get Wallets
```http
GET /wallets
Authorization: Bearer {token}

Response: 200 OK
[
  {
    "id": "string",
    "name": "string",
    "type": "string",
    "balance": "number",
    "currency": "string"
  }
]
```

## Transaction Management

### Create Transaction
```http
POST /transactions
Authorization: Bearer {token}
Content-Type: application/json

{
  "walletId": "string",
  "amount": "number",
  "type": "income|expense|transfer",
  "category": "string",
  "description": "string",
  "date": "string"
}

Response: 201 Created
{
  "id": "string",
  "walletId": "string",
  "amount": "number",
  "type": "string",
  "category": "string",
  "description": "string",
  "date": "string"
}
```

### Get Transactions
```http
GET /transactions
Authorization: Bearer {token}
Query Parameters:
  - walletId (optional)
  - startDate (optional)
  - endDate (optional)
  - type (optional)
  - category (optional)

Response: 200 OK
[
  {
    "id": "string",
    "walletId": "string",
    "amount": "number",
    "type": "string",
    "category": "string",
    "description": "string",
    "date": "string"
  }
]
```

## Budget Management

### Create Budget
```http
POST /budgets
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "string",
  "amount": "number",
  "period": "monthly|yearly",
  "categories": ["string"],
  "startDate": "string"
}

Response: 201 Created
{
  "id": "string",
  "name": "string",
  "amount": "number",
  "period": "string",
  "categories": ["string"],
  "startDate": "string"
}
```

### Get Budgets
```http
GET /budgets
Authorization: Bearer {token}

Response: 200 OK
[
  {
    "id": "string",
    "name": "string",
    "amount": "number",
    "period": "string",
    "categories": ["string"],
    "startDate": "string",
    "currentSpending": "number"
  }
]
```

## Savings Management

### Create Savings Account
```http
POST /saving-accounts
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "string",
  "type": "string",
  "interestRate": "number",
  "initialBalance": "number"
}

Response: 201 Created
{
  "id": "string",
  "name": "string",
  "type": "string",
  "balance": "number",
  "interestRate": "number"
}
```

### Create Savings Goal
```http
POST /saving-goals
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "string",
  "targetAmount": "number",
  "deadline": "string",
  "accountId": "string"
}

Response: 201 Created
{
  "id": "string",
  "name": "string",
  "targetAmount": "number",
  "currentAmount": "number",
  "deadline": "string",
  "progress": "number"
}
```

## Category Management

### Create Category
```http
POST /categories
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "string",
  "type": "income|expense",
  "icon": "string",
  "color": "string"
}

Response: 201 Created
{
  "id": "string",
  "name": "string",
  "type": "string",
  "icon": "string",
  "color": "string"
}
```

### Get Categories
```http
GET /categories
Authorization: Bearer {token}
Query Parameters:
  - type (optional)

Response: 200 OK
[
  {
    "id": "string",
    "name": "string",
    "type": "string",
    "icon": "string",
    "color": "string"
  }
]
```

## Profile Management

### Get Profile
```http
GET /profile
Authorization: Bearer {token}

Response: 200 OK
{
  "id": "string",
  "name": "string",
  "email": "string",
  "preferences": {
    "currency": "string",
    "language": "string",
    "theme": "string"
  }
}
```

### Update Profile
```http
PUT /profile
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "string",
  "preferences": {
    "currency": "string",
    "language": "string",
    "theme": "string"
  }
}

Response: 200 OK
{
  "id": "string",
  "name": "string",
  "email": "string",
  "preferences": {
    "currency": "string",
    "language": "string",
    "theme": "string"
  }
}
```

## Error Responses

### 400 Bad Request
```json
{
  "error": "Bad Request",
  "message": "Invalid input data"
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Invalid authentication token"
}
```

### 403 Forbidden
```json
{
  "error": "Forbidden",
  "message": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "error": "Not Found",
  "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal Server Error",
  "message": "Something went wrong"
}
```

## Rate Limiting

The API implements rate limiting to prevent abuse. Limits are as follows:

- 100 requests per minute per IP
- 1000 requests per hour per user
- 5000 requests per day per user

Rate limit headers are included in all responses:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1613439272
```

## Authentication

All protected endpoints require a valid JWT token in the Authorization header:
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Pagination

List endpoints support pagination using query parameters:
```http
?page=1&limit=20
```

Pagination metadata is included in the response headers:
```http
X-Total-Count: 100
X-Total-Pages: 5
X-Current-Page: 1
```
