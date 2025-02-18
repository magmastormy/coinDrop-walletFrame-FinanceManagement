# WalletCard Component

## Description
The WalletCard component is a rich interactive card that displays wallet information in the CoinDrop application. It provides a visually appealing interface with animations and supports operations like editing, deleting, and transferring funds between wallets.

## Component Structure

### Props
```javascript
const WalletCard = ({ 
    wallet,          // Wallet data object
    wallets,         // Array of all wallets for transfer
    onUpdate,        // Function to handle wallet updates
    onDelete,        // Function to handle wallet deletion
    onTransfer       // Function to handle transfers between wallets
}) => {
    // Component implementation
}
```

### State Management
```javascript
const [showOptions, setShowOptions] = useState(false);
const [showTransferModal, setShowTransferModal] = useState(false);
const [showEditModal, setShowEditModal] = useState(false);
const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
const [optionsPosition, setOptionsPosition] = useState({ top: 0, left: 0 });
```

### Dependencies
- External Libraries:
  - react-dom (createPortal)
  - framer-motion
  - @fortawesome/react-fontawesome
- Internal Components:
  - EditWalletModal
  - WalletTransfer

## Key Features

### 1. Wallet Type Icons
```javascript
const getWalletIcon = (type) => {
    switch (type?.toLowerCase()) {
        case 'cash':
            return faMoneyBillWave;
        case 'credit card':
            return faCreditCard;
        case 'bank':
            return faUniversity;
        case 'savings':
            return faPiggyBank;
        default:
            return faWallet;
    }
};
```

### 2. Currency Formatting
```javascript
const formatBalance = (balance) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(balance);
};
```

### 3. Options Menu Positioning
```javascript
const updateOptionsPosition = useCallback(() => {
    if (optionsButtonRef.current) {
        const rect = optionsButtonRef.current.getBoundingClientRect();
        setOptionsPosition({
            top: rect.bottom + window.scrollY + 5,
            left: rect.right - 150
        });
    }
}, []);
```

## Implementation Details

### Modal Management
```javascript
{showEditModal && createPortal(
    <div className="modal-overlay">
        <div className="modal-content">
            <EditWalletModal
                wallet={wallet}
                onClose={() => setShowEditModal(false)}
                onUpdate={onUpdate}
            />
        </div>
    </div>,
    document.body
)}
```

### Animation Integration
```javascript
<motion.div 
    className="wallet-card"
    role="article"
    aria-label={`Wallet: ${wallet.name}`}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.2 }}
    whileHover={{ y: -5 }}
>
    {/* Card content */}
</motion.div>
```

## UI Components

### Card Layout
```jsx
<div className="wallet-card-content">
    <h3 className="wallet-name" title={wallet.name}>
        {wallet.name}
    </h3>
    <div className="wallet-type" title={wallet.type}>
        {wallet.type}
    </div>
    <motion.div 
        className={`wallet-balance ${wallet.balance >= 0 ? 'positive' : 'negative'}`}
        aria-label={`Balance: ${formatBalance(wallet.balance)}`}
    >
        {formatBalance(wallet.balance)}
    </motion.div>
</div>
```

### Options Menu
```jsx
<motion.div 
    className="options-menu" 
    role="menu" 
    aria-label="Wallet options"
    initial={{ opacity: 0, scale: 0.95, y: -10 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.95, y: -10 }}
    transition={{ duration: 0.1 }}
>
    {/* Menu items */}
</motion.div>
```

## Event Handling

### Click Outside Detection
```javascript
const handleOutsideClick = useCallback((e) => {
    if (optionsButtonRef.current && !optionsButtonRef.current.contains(e.target)) {
        setShowOptions(false);
        setShowDeleteConfirm(false);
    }
}, []);
```

### Keyboard Navigation
```javascript
const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
        setShowOptions(false);
        setShowDeleteConfirm(false);
    }
};
```

## Performance Considerations

### 1. Memoization
- useCallback for event handlers
- Optimized position calculations
- Efficient re-renders

### 2. Portal Usage
- Modal rendering optimization
- DOM hierarchy management
- Improved stacking context

### 3. Animation Performance
- Hardware acceleration
- Efficient transitions
- Optimized transforms

## Best Practices

### 1. Component Organization
- Modular structure
- Clear separation of concerns
- Reusable components
- Clean code practices

### 2. Event Management
- Proper cleanup
- Event delegation
- Memory leak prevention
- Performance optimization

### 3. State Handling
- Controlled components
- Predictable updates
- Clear data flow
- Error boundaries

## Accessibility Features

### 1. ARIA Attributes
```javascript
role="article"
aria-label={`Wallet: ${wallet.name}`}
aria-expanded={showOptions}
aria-haspopup="true"
role="menu"
role="menuitem"
```

### 2. Keyboard Support
- Escape key handling
- Focus management
- Navigation support
- Interactive elements

## Styling

### 1. Visual Feedback
```css
.wallet-card {
    /* Card styling */
    /* Hover effects */
    /* Transitions */
}

.wallet-balance {
    /* Balance display */
    /* Positive/negative states */
    /* Animation effects */
}

.options-menu {
    /* Menu positioning */
    /* Dropdown styling */
    /* Interactive states */
}
```

### 2. Animation States
- Hover effects
- Click feedback
- Transition states
- Loading indicators

## Usage Example
```jsx
import WalletCard from './components/Wallet/WalletCard';

function WalletContainer() {
    const wallet = {
        _id: '123',
        name: 'Main Account',
        type: 'bank',
        balance: 1000.00
    };
    
    return (
        <WalletCard
            wallet={wallet}
            wallets={wallets}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
            onTransfer={handleTransfer}
        />
    );
}
```

## Error Handling
- Null checks
- Type validation
- Error boundaries
- Fallback UI

## Testing Considerations
- Component unit tests
- Integration tests
- Animation testing
- Accessibility testing
- Event handling tests

## Future Enhancements
1. Additional wallet types
2. Custom animations
3. Enhanced interactions
4. Theme support
5. Advanced gestures
