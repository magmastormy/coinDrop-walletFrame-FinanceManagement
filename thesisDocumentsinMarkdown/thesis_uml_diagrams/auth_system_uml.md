# Authentication System UML Diagrams

## Class Diagram

```mermaid
classDiagram
    class User {
        +String username
        +String email
        +String password
        +String firstName
        +String lastName
        +String role
        +Date lastLogin
        +Boolean isVerified
        +generateAuthToken()
        +comparePassword(password)
        +toPublicProfile()
    }

    class UserProfile {
        +ObjectId user
        +String username
        +String bio
        +String location
        +Array interests
        +Number reputation
        +Array badges
        +Date createdAt
    }

    class AuthController {
        +generateTokens(userId, role)
        +register(req, res)
        +login(req, res)
        +refreshToken(req, res)
        +logout(req, res)
        -validateRegistration(data)
        -handleLoginError(error)
    }

    class AuthService {
        +registerUser(userData)
        +loginUser(credentials)
        +logout()
        +refreshToken()
        -storeUserData(token, user)
        -clearUserData()
    }

    class ProtectedRoute {
        +children: ReactNode
        +render()
    }

    class AuthContext {
        +user: User
        +isAuthenticated: boolean
        +loading: boolean
        +login(credentials)
        +logout()
        +updateUser(data)
    }

    AuthController --> User : manages
    AuthController --> UserProfile : creates
    User --> UserProfile : has
    AuthService --> AuthController : uses
    ProtectedRoute --> AuthContext : uses
    AuthContext --> AuthService : uses
```

## Sequence Diagrams

### Registration Flow

```mermaid
sequenceDiagram
    participant U as User
    participant RF as RegistrationForm
    participant AS as AuthService
    participant AC as AuthController
    participant DB as Database

    U->>RF: Fill registration form
    RF->>RF: Validate input
    RF->>AS: Submit registration
    AS->>AC: POST /auth/register
    AC->>AC: Validate data
    AC->>DB: Check existing user
    
    alt User exists
        DB-->>AC: User found
        AC-->>AS: 400 User exists
        AS-->>RF: Error: User exists
        RF-->>U: Show error message
    else User doesn't exist
        DB-->>AC: No user found
        AC->>DB: Begin transaction
        AC->>DB: Create user
        AC->>DB: Create profile
        DB-->>AC: Success
        AC->>AC: Generate tokens
        AC-->>AS: 201 Created + tokens
        AS-->>RF: Success + redirect
        RF-->>U: Redirect to dashboard
    end
```

### Login Flow

```mermaid
sequenceDiagram
    participant U as User
    participant LF as LoginForm
    participant AS as AuthService
    participant AC as AuthController
    participant DB as Database

    U->>LF: Enter credentials
    LF->>LF: Validate input
    LF->>AS: Submit login
    AS->>AC: POST /auth/login
    AC->>DB: Find user
    
    alt Invalid credentials
        DB-->>AC: User not found
        AC-->>AS: 401 Unauthorized
        AS-->>LF: Error: Invalid credentials
        LF-->>U: Show error message
    else Valid credentials
        DB-->>AC: User found
        AC->>AC: Verify password
        AC->>AC: Generate tokens
        AC->>DB: Update lastLogin
        AC-->>AS: 200 OK + tokens
        AS-->>LF: Success + redirect
        LF-->>U: Redirect to dashboard
    end
```

### Token Refresh Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant AS as AuthService
    participant AC as AuthController
    participant TS as TokenService

    C->>AS: Request protected resource
    AS->>AS: Check token expiration
    
    alt Token expired
        AS->>AC: POST /auth/refresh
        AC->>TS: Validate refresh token
        
        alt Valid refresh token
            TS->>TS: Generate new tokens
            TS-->>AC: New tokens
            AC-->>AS: 200 OK + new tokens
            AS-->>C: Continue with request
        else Invalid refresh token
            TS-->>AC: Invalid token
            AC-->>AS: 401 Unauthorized
            AS-->>C: Redirect to login
        end
    else Token valid
        AS->>C: Continue with request
    end
```

## Component Diagram

```mermaid
graph TD
    A[App] --> B[AuthProvider]
    B --> C[ProtectedRoute]
    B --> D[LoginForm]
    B --> E[RegistrationForm]
    
    C --> F[Dashboard]
    C --> G[WalletManager]
    C --> H[TransactionManager]
    
    D --> I[AuthService]
    E --> I
    I --> J[AuthController]
    
    J --> K[User Model]
    J --> L[UserProfile Model]
    
    style A fill:#f9f,stroke:#333,stroke-width:2px
    style B fill:#bbf,stroke:#333,stroke-width:2px
    style I fill:#bfb,stroke:#333,stroke-width:2px
    style J fill:#fbb,stroke:#333,stroke-width:2px
```

---

**Last Updated**: 2025-02-23
**Author**: System Architecture Team
