# WalletManager Component

## Description
The WalletManager component serves as the central hub for managing digital wallets in the CoinDrop application. It provides comprehensive functionality for creating, viewing, updating, and managing wallets, including budget tracking and transaction history.

## Component Structure

### State Management
```javascript
const dispatch = useDispatch();
const { wallets, loading, error } = useSelector(state => state.wallet);
const { user } = useSelector(state => state.auth);
const [activeView, setActiveView] = useState('wallets');
const [selectedWallet, setSelectedWallet] = useState(null);
const [walletBudgets, setWalletBudgets] = useState([]);
```

### Dependencies
- External Libraries:
  - react-redux
  - framer-motion
  - @fortawesome/react-fontawesome
- Internal Services:
  - walletService
- Components:
  - CreateNewWallet
  - WalletList
  - WalletBudgetList
  - TransactionList
  - WalletChart

## Key Features

### 1. Wallet Operations

#### Fetch Wallets
```javascript
const fetchWallets = async () => {        
    dispatch(setLoading(true));
    try {
        if (!user || !user.id) {
            throw new Error('User not authenticated');
        }
        const walletdata = await walletService.getAllWallets(user.id);
        dispatch(setWallets(walletdata.wallets || []));
    } catch (error) {
        dispatch(setError(error.message));
    } finally {
        dispatch(setLoading(false));
    }
};
```

#### Wallet Selection and Budget Fetching
```javascript
const handleWalletSelect = async (wallet) => {
    try {
        const data = await walletService.getWalletBudgets(wallet._id);
        setWalletBudgets(data.budgets);
        setSelectedWallet(wallet);
        setActiveView('budgets');
    } catch (err) {
        console.error(err);
    }
};
```

### 2. Transfer Operations
```javascript
const handleTransfer = async (fromWalletId, toWalletId, amount) => {
    try {
        dispatch(setLoading(true));
        await walletService.transferBetweenWallets(fromWalletId, toWalletId, amount);
        await fetchWallets();
    } catch (err) {
        dispatch(setError(err.response?.data?.error || err.message));
    } finally {
        dispatch(setLoading(false));
    }
};
```

## Implementation Details

### Redux Integration
- Uses wallet slice for state management
- Dispatches actions for CRUD operations
- Manages loading and error states

### Component Views
1. Main Wallet View
   - Wallet list
   - Creation interface
   - Transfer functionality
   
2. Detailed Wallet View
   - Budget list
   - Transaction history
   - Back navigation

## UI Components

### Layout Structure
```jsx
<div className="wallet-manager">
    <h2>My Wallets</h2>
    <div className="wallet-chart-container">
        <FontAwesomeIcon icon={faWallet} size="lg" />
        <WalletChart wallets={wallets} />
    </div>
    
    {!selectedWallet ? (
        // Main wallet view
        <div>
            <CreateNewWallet onWalletCreated={fetchWallets} />
            <WalletList 
                wallets={wallets}
                onWalletSelect={handleWalletSelect}
                onDelete={handleDeleteWallet}
                onWalletUpdate={handleWalletUpdate}
                onTransfer={handleTransfer}
            />
        </div>
    ) : (
        // Detailed wallet view
        <div>
            <button className="back-button">
                <FontAwesomeIcon icon={faArrowLeft} />
                <span onClick={() => setSelectedWallet(null)}>
                    Back to Wallets
                </span>
            </button>
            <div>
                <h3>{selectedWallet.name}</h3>
                <WalletBudgetList budgets={walletBudgets} />
                <TransactionList walletId={selectedWallet._id} />
            </div>
        </div>
    )}
</div>
```

## Animation Features
```javascript
<motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.3 }}
>
```

## Error Handling
```javascript
if (error) {
    return <div className="error-message">{error}</div>;
}
```

## Loading States
```javascript
if (loading) {
    return <div>Loading your wallets...</div>;
}
```

## Usage Example
```jsx
import WalletManager from './components/Wallet/walletManager';

function App() {
    return (
        <Route path="/wallets" element={<WalletManager />} />
    );
}
```

## Performance Considerations

### 1. Data Management
- Efficient state updates
- Optimized re-renders
- Controlled component updates

### 2. Error Boundaries
- Graceful error handling
- User-friendly messages
- Recovery mechanisms

### 3. Loading States
- Clear loading indicators
- Progressive loading
- Optimistic updates

## Best Practices

### 1. State Management
- Centralized Redux store
- Local state for UI
- Efficient updates
- Clear data flow

### 2. Error Handling
- Comprehensive error catching
- User-friendly messages
- Recovery options
- Logging and monitoring

### 3. User Experience
- Intuitive navigation
- Clear feedback
- Smooth transitions
- Responsive design

## Security Considerations
- User authentication checks
- Data validation
- Secure transfers
- Input sanitization

## Styling
- Responsive design
- Theme integration
- Consistent layout
- Visual feedback

## Accessibility Features
- ARIA labels
- Keyboard navigation
- Focus management
- Screen reader support
