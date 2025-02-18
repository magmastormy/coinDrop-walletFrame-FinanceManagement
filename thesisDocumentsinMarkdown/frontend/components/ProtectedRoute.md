# ProtectedRoute Component

## Description
The ProtectedRoute component is a security wrapper that protects routes from unauthorized access in the CoinDrop application. It ensures that only authenticated users can access certain routes and redirects unauthenticated users to the login page.

## Component Structure

### Dependencies
- External Libraries:
  - react
  - react-router-dom
- Internal Components:
  - LoadingSpinner
- Contexts:
  - AuthContext (useAuth hook)

## Implementation

### Core Logic
```javascript
const ProtectedRoute = ({children}) => {
    const {isAuthenticated, loading} = useAuth();

    if (loading) { 
        return <LoadingSpinner/>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace/>;
    }

    return children || <Outlet/>;
};
```

## Key Features

### 1. Authentication Check
- Uses AuthContext to verify user authentication status
- Prevents unauthorized access to protected routes
- Maintains security across the application

### 2. Loading State
- Displays a loading spinner while checking authentication
- Prevents flash of unauthorized content
- Improves user experience during authentication checks

### 3. Route Handling
- Supports both direct children and nested routes (via Outlet)
- Provides seamless integration with React Router
- Maintains proper navigation history

## Usage Examples

### Basic Route Protection
```jsx
// Protecting a single route
<Route 
    path="/dashboard" 
    element={
        <ProtectedRoute>
            <DashboardComponent />
        </ProtectedRoute>
    } 
/>
```

### Protecting Multiple Routes
```jsx
// Protecting multiple nested routes
<Route element={<ProtectedRoute>}>
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/profile" element={<Profile />} />
    <Route path="/settings" element={<Settings />} />
</Route>
```

## Security Considerations

### 1. Authentication State
- Relies on secure authentication context
- Prevents direct URL access to protected routes
- Maintains session security

### 2. Navigation
- Uses replace navigation to prevent back-button security issues
- Maintains clean navigation history
- Ensures proper redirection behavior

## Error Handling
- Graceful handling of authentication states
- Clear logging for debugging purposes
- Proper loading state management

## Performance Considerations
1. Efficient Authentication Checking
   - Minimal re-renders
   - Optimized context usage
   - Quick loading state transitions

2. Route Protection
   - Immediate unauthorized redirects
   - Efficient route guarding
   - Minimal computation overhead

## Props
| Prop | Type | Description |
|------|------|-------------|
| children | React.ReactNode | Protected content to render |

## Context Usage
```javascript
const {isAuthenticated, loading} = useAuth();
```
- isAuthenticated: Boolean indicating user authentication status
- loading: Boolean indicating authentication check status

## Debugging Features
- Comprehensive console logging
- Authentication state tracking
- Navigation event logging

## Integration Points
1. React Router Integration
   - Compatible with React Router v6
   - Supports nested routes
   - Works with route configurations

2. Authentication System
   - Integrates with AuthContext
   - Supports custom authentication logic
   - Flexible security implementation

## Best Practices
1. Implementation
   - Place ProtectedRoute at the router level
   - Use for sensitive routes only
   - Maintain consistent security checks

2. Usage
   - Implement at parent route level when possible
   - Combine with role-based access when needed
   - Keep authentication logic centralized
