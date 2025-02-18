# SavingsAccountManager Component

## Description
The SavingsAccountManager is a core component of the CoinDrop application that handles the management of user savings accounts. It provides a comprehensive interface for viewing, creating, and managing savings accounts, including operations like deposits, withdrawals, transfers, and account modifications.

## Component Structure

### State Management
```javascript
const [accounts, setAccounts] = useState([]);
const [wallets, setWallets] = useState([]);
const [selectedAccount, setSelectedAccount] = useState(null);
const [transactionAmount, setTransactionAmount] = useState(0);
const [selectedWallet, setSelectedWallet] = useState('');
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState(null);
```

### Dependencies
- External Libraries:
  - React
  - @mui/material
  - framer-motion
- Internal Modules:
  - AuthContext
  - ThemeContext
  - savingsAccountService
  - walletService
- Components:
  - SavingsAccountCard
  - SavingsOperations
  - SavingsAccountEditDialog
  - SavingsAccountTransferDialog
  - SavingsAccountTransactionTable
  - SavingsAnalytics

## Key Features

### 1. Account Management
- Fetching user savings accounts
- Creating new savings accounts
- Editing existing accounts
- Deleting accounts

### 2. Transaction Operations
- Deposits
- Withdrawals
- Transfers between accounts
- Transaction history viewing

### 3. Analytics
- Account performance tracking
- Savings goals progress
- Visual analytics through SavingsAnalytics component

## API Integration

### Fetch Accounts
```javascript
const fetchAccounts = async () => {
    try {
        setIsLoading(true);
        const response = await savingsAccountService.getUserSavingsAccounts(user.id);
        setAccounts(response || []);
    } catch (error) {
        console.error('Failed to fetch accounts:', error);
        setError('Failed to load savings accounts. Please try again later.');
    } finally {
        setIsLoading(false);
    }
};
```

### Handle Transactions
```javascript
const handleTransaction = async (type, accountId, amount, walletId) => {
    try {
        if (type === 'deposit') {
            await savingsAccountService.depositToSavings({
                accountId,
                walletId,
                amount: Number(amount)
            });
        } else {
            await savingsAccountService.withdrawFromSavings({
                accountId,
                walletId,
                amount: Number(amount)
            });
        }
        await Promise.all([fetchAccounts(), fetchWallets()]);
        setModalState(prev => ({
            ...prev,
            [type]: { open: false }
        }));
    } catch (error) {
        console.error('Transaction failed:', error);
        setError('Transaction failed. Please try again later.');
    }
};
```

## UI/UX Features
- Responsive grid layout for account cards
- Loading states and error handling
- Smooth animations using framer-motion
- Dark mode support
- Modal-based operation dialogs

## Error Handling
The component implements comprehensive error handling:
- Loading states for asynchronous operations
- Error messages for failed operations
- Fallback UI for error states
- Console logging for debugging

## Usage Example
```jsx
// In a parent component or route
import SavingsAccountManager from './components/Savings/savingsAccountManager';

function App() {
    return (
        <div>
            <SavingsAccountManager />
        </div>
    );
}
```

## Props
This component doesn't accept any props as it manages its own state and uses context for user and theme information.

## Context Usage
- AuthContext: For user authentication and identification
- ThemeContext: For theme-related styling and dark mode support

## Styling
The component uses a combination of Material-UI styling and custom CSS:
- Material-UI Grid system for layout
- Custom CSS classes for specific styling
- Framer Motion for animations
- Theme-aware styling through ThemeContext

## Performance Considerations
- Efficient state updates using useState
- Optimized re-renders through proper state management
- Async operations for data fetching
- Proper cleanup and error handling
- Conditional rendering for large components
