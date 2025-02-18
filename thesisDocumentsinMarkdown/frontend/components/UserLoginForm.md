# UserLogin Component

## Description
The UserLogin component provides the authentication interface for existing users to access the CoinDrop application. It implements a secure login form with email and password fields, error handling, loading states, and navigation to registration for new users.

## Component Structure

### State Management
```javascript
const [formData, setFormData] = useState({
    email: '',
    password: ''
});
const [error, setError] = useState('');
const [loading, setLoading] = useState(false);
```

### Dependencies
- External Libraries:
  - react
  - react-router-dom
- Internal Modules:
  - authService (loginUser)
  - loginStyles.css

## Key Features

### 1. Form Handling
- Controlled form inputs
- Real-time input validation
- Secure password field
- Form submission handling

### 2. Error Management
- Display of authentication errors
- User-friendly error messages
- Error state clearing on new attempts

### 3. User Experience
- Loading states during authentication
- Disabled submit button while processing
- Smooth navigation post-login
- Link to registration for new users

## Implementation Details

### Form State Handler
```javascript
const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
        ...prev,
        [name]: value
    }));
};
```

### Authentication Handler
```javascript
const handleSubmit = async (e) => {
    e.preventDefault();
    try {
        setError('');
        setLoading(true);
        await loginUser(formData);
        navigate('/dashboard');
    } catch (err) {
        setError(err.message || 'Failed to sign in');
    } finally {
        setLoading(false);
    }
};
```

## UI Components

### Form Fields
1. Email Input
```jsx
<input
    id="email"
    name="email"
    type="email"
    required
    className="login-input"
    placeholder="Enter your email"
    value={formData.email}
    onChange={handleChange}
/>
```

2. Password Input
```jsx
<input
    id="password"
    name="password"
    type="password"
    required
    className="login-input"
    placeholder="Enter your password"
    value={formData.password}
    onChange={handleChange}
/>
```

## Styling
The component uses a dedicated CSS module (loginStyles.css) with classes for:
- Container layout
- Form card styling
- Input field appearance
- Button states
- Error message display
- Responsive design

## Security Considerations
1. Password Field Security
   - Type="password" for masked input
   - No password storage in component state
   - Secure transmission to authentication service

2. Form Protection
   - Prevention of multiple submissions
   - Input validation
   - Error handling for failed attempts

## Usage Example
```jsx
// In App.jsx or router configuration
import UserLogin from './components/Auth/userLoginForm';

function App() {
    return (
        <Routes>
            <Route path="/login" element={<UserLogin />} />
        </Routes>
    );
}
```

## Error States
The component handles various error scenarios:
- Invalid credentials
- Network errors
- Server errors
- Empty field validation

## Performance Considerations
- Minimal state updates
- Efficient form handling
- Proper cleanup of async operations
- Optimized re-renders

## Accessibility Features
- Semantic HTML structure
- ARIA roles for error messages
- Proper label associations
- Keyboard navigation support
- Loading state indicators
