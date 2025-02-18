# BudgetCard Component

## Description
The BudgetCard component is a visual representation of a budget item in the CoinDrop application. It displays budget details, progress, and provides interaction options in an animated, responsive card format.

## Component Structure

### Props Interface
```javascript
interface BudgetCardProps {
    budget: {
        _id: string;
        name: string;
        type: string;
        amount: number;
        spent: number;
        categoryId: {
            name: string;
        };
        startDate: string;
        endDate: string;
        status: string;
    };
    onEdit: (budget: Budget) => void;
    onDelete: (budgetId: string) => void;
}
```

### Dependencies
- External Libraries:
  - @fortawesome/react-fontawesome
  - @fortawesome/free-solid-svg-icons
  - framer-motion
- Styles:
  - budgetCardStyles.css

## Key Features

### 1. Data Formatting
```javascript
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
};

const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};
```

### 2. Progress Calculation
```javascript
const calculateProgress = () => {
    const spent = budget.spent || 0;
    const progress = (spent / budget.amount) * 100;
    return Math.min(progress, 100);
};

const getStatusColor = () => {
    const progress = calculateProgress();
    if (progress >= 90) return 'var(--error)';
    if (progress >= 70) return 'var(--warning)';
    return 'var(--accent-2)';
};
```

## UI Components

### 1. Card Structure
```jsx
<motion.div className="budget-card">
    <div className="budget-header">
        <h3>{budget.name}</h3>
        <div className="budget-type-badge">
            {budget.type}
        </div>
    </div>
    
    <div className="budget-progress">
        {/* Progress bar and details */}
    </div>
    
    <div className="budget-details">
        {/* Category and date information */}
    </div>
    
    <div className="budget-actions">
        {/* Edit and delete buttons */}
    </div>
</motion.div>
```

### 2. Progress Bar
```jsx
<div className="progress-bar">
    <div 
        className="progress-fill" 
        style={{ 
            width: `${calculateProgress()}%`,
            backgroundColor: getStatusColor()
        }}
        role="progressbar"
        aria-valuenow={calculateProgress()}
        aria-valuemin="0"
        aria-valuemax="100"
    />
</div>
```

## Animation Features

### 1. Card Animations
```javascript
<motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    whileHover={{ scale: 1.02 }}
    transition={{ duration: 0.2 }}
>
```

## Styling

### 1. Theme Integration
- Uses CSS variables for colors
- Responsive design
- Dynamic status colors
- Hover effects

### 2. Visual Feedback
- Progress bar color changes
- Hover animations
- Interactive buttons
- Status indicators

## Accessibility Features

### 1. ARIA Attributes
```jsx
<div 
    role="progressbar"
    aria-valuenow={calculateProgress()}
    aria-valuemin="0"
    aria-valuemax="100"
/>

<button 
    aria-label="Edit budget"
>
    <FontAwesomeIcon icon={faEdit} aria-hidden="true" />
    Edit
</button>
```

### 2. Semantic HTML
- Proper heading hierarchy
- Meaningful button labels
- Icon accessibility
- Progress bar roles

## Usage Example
```jsx
import BudgetCard from './components/Budget/budgetCard';

const MyComponent = () => {
    const handleEdit = (budget) => {
        // Handle budget editing
    };
    
    const handleDelete = (budgetId) => {
        // Handle budget deletion
    };
    
    return (
        <BudgetCard
            budget={budgetData}
            onEdit={handleEdit}
            onDelete={handleDelete}
        />
    );
};
```

## Performance Considerations

### 1. Render Optimization
- Memoized calculations
- Efficient status updates
- Optimized animations

### 2. Animation Performance
- Hardware acceleration
- Smooth transitions
- Minimal layout shifts

## Best Practices

### 1. Data Display
- Clear information hierarchy
- Visual progress indication
- Intuitive interaction points

### 2. User Experience
- Responsive feedback
- Smooth animations
- Clear action buttons

### 3. Maintenance
- Modular structure
- Reusable functions
- Clear prop interface

## Error Handling
- Fallback for missing data
- Safe calculations
- Default values
- Proper type checking

## Theming Support
- CSS variable integration
- Dynamic color schemes
- Consistent styling
- Flexible layout
