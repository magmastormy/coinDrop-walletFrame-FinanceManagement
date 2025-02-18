# UserRegistration Component

## Description
The UserRegistration component provides a comprehensive registration interface for new users of the CoinDrop application. It implements a secure, validated registration form with multiple fields, robust error handling, password validation, and user feedback through toast notifications.

## Component Structure

### State Management
```javascript
const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: ''
});
const [loading, setLoading] = useState(false);
```

### Dependencies
- External Libraries:
  - react
  - react-router-dom
  - react-toastify
- Internal Modules:
  - authService (registerUser)
  - registrationStyles.css

## Key Features

### 1. Form Validation
- Password complexity requirements
- Password matching validation
- Email format validation
- Required field validation

### 2. Security Features
```javascript
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
```
- Minimum password length: 8 characters
- Required character types:
  - Uppercase letters
  - Lowercase letters
  - Numbers
  - Special characters

### 3. User Experience
- Interactive form validation
- Toast notifications for feedback
- Loading states
- Clear error messages
- Password requirements display
- Smooth navigation

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

### Registration Handler
```javascript
const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation checks
    if (formData.password !== formData.confirmPassword) {
        toast.error('Passwords do not match');
        return;
    }

    try {
        setLoading(true);
        await registerUser(formData);
        toast.success('Account created successfully!');
        navigate('/dashboard');
    } catch (err) {
        handleRegistrationError(err);
    } finally {
        setLoading(false);
    }
};
```

## Form Fields

### Personal Information
```jsx
<div className="registration-form-grid">
    <div className="form-field">
        <input
            id="firstName"
            name="firstName"
            type="text"
            required
            className="form-input"
            placeholder="First Name"
        />
    </div>
    <div className="form-field">
        <input
            id="lastName"
            name="lastName"
            type="text"
            required
            className="form-input"
            placeholder="Last Name"
        />
    </div>
</div>
```

### Account Information
```jsx
<div className="form-field">
    <input
        id="email"
        name="email"
        type="email"
        required
        className="form-input"
        placeholder="Email address"
    />
</div>
<div className="form-field">
    <input
        id="username"
        name="username"
        type="text"
        required
        className="form-input"
        placeholder="Username"
    />
</div>
```

## Error Handling
The component implements a comprehensive error handling system:
1. Client-side validation errors
2. Server response errors
3. Network errors
4. Validation-specific errors

```javascript
if (err.response?.data?.details) {
    const errors = err.response.data.details;
    errors.forEach(error => {
        toast.error(error.msg);
    });
} else if (err.response?.data?.message) {
    toast.error(err.response.data.message);
} else {
    toast.error(err.message || 'Failed to create account. Please try again.');
}
```

## Styling
The component uses a dedicated CSS module (registrationStyles.css) with:
- Grid layout for form fields
- Responsive design
- Form input styling
- Error state styling
- Loading state indicators

## Security Considerations
1. Password Security
   - Strong password requirements
   - Password confirmation
   - Secure transmission

2. Data Validation
   - Client-side validation
   - Server-side validation
   - Input sanitization

## Usage Example
```jsx
// In App.jsx or router configuration
import UserRegistration from './components/Auth/userRegistrationForm';

function App() {
    return (
        <Routes>
            <Route path="/register" element={<UserRegistration />} />
        </Routes>
    );
}
```

## Accessibility Features
- Semantic HTML structure
- Screen reader support
- ARIA labels
- Keyboard navigation
- Clear error messaging
- Visual feedback

## Performance Considerations
- Efficient form state management
- Optimized validation checks
- Proper error boundary implementation
- Controlled component optimization
