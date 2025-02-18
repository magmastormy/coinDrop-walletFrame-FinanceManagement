# TransactionList Component

## Description
The TransactionList component provides a sophisticated, interactive table view of financial transactions in the CoinDrop application. It features sorting capabilities, custom cell rendering, and action buttons for each transaction entry.

## Component Structure

### Props Interface
```typescript
interface TransactionListProps {
    transactions: Transaction[];
    onEdit: (transaction: Transaction) => void;
    onDelete: (transactionId: string) => void;
    wallets: Wallet[];
    savingsAccounts: SavingsAccount[];
}
```

### Dependencies
- External Libraries:
  - react-table (useTable, useSortBy)
- Styles:
  - transactionListStyles.css

## Key Features

### 1. Table Configuration
```javascript
const columns = React.useMemo(
    () => [
        {
            Header: 'Source',
            accessor: 'source',
            Cell: ({ row }) => {
                const transaction = row.original;
                const sourceName = transaction.walletId ? 
                    (wallets.find(w => w._id === transaction.walletId)?.name || 'Wallet') :
                    (savingsAccounts.find(s => s._id === transaction.savingsAccountId)?.name || 'Savings Account');
                
                return <div className="transaction-source">{sourceName}</div>;
            }
        },
        // ... other columns
    ],
    [onEdit, onDelete, wallets, savingsAccounts]
);
```

### 2. Data Processing
```javascript
const data = React.useMemo(() => 
    Array.isArray(transactions) ? transactions.map(t => ({
        ...t,
        date: t.date ? new Date(t.date) : new Date()
    })) : [],
    [transactions]
);
```

### 3. Sorting Implementation
```javascript
const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
} = useTable(
    {
        columns,
        data,
        initialState: {
            sortBy: [{ id: 'date', desc: true }]
        }
    },
    useSortBy
);
```

## Implementation Details

### Column Definitions

#### 1. Source Column
```javascript
{
    Header: 'Source',
    accessor: 'source',
    Cell: ({ row }) => {
        const transaction = row.original;
        const sourceName = transaction.walletId ? 
            (wallets.find(w => w._id === transaction.walletId)?.name || 'Wallet') :
            (savingsAccounts.find(s => s._id === transaction.savingsAccountId)?.name || 'Savings Account');
        
        return <div className="transaction-source">{sourceName}</div>;
    }
}
```

#### 2. Amount Column
```javascript
{
    Header: 'Amount',
    accessor: 'amount',
    Cell: ({ value, row }) => (
        <div className={`transaction-amount ${row.original.type}`}>
            {row.original.type === 'expense' ? '-' : '+'}${Math.abs(Number(value)).toFixed(2)}
        </div>
    )
}
```

#### 3. Date Column
```javascript
{
    Header: 'Date',
    accessor: 'date',
    Cell: ({ value }) => {
        const dateObj = new Date(value);
        return (
            <div className="transaction-date">
                {isNaN(dateObj) ? 'Invalid date' : dateObj.toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                })}
            </div>
        );
    }
}
```

## UI Components

### 1. Table Structure
```jsx
<div className="transaction-table-container" role="region" aria-label="Transactions list">
    <table className="transaction-table" {...getTableProps()}>
        <thead>
            {headerGroups.map(headerGroup => (
                <tr {...headerGroup.getHeaderGroupProps()}>
                    {headerGroup.headers.map(column => (
                        <th {...column.getHeaderProps(column.getSortByToggleProps())}>
                            {column.render('Header')}
                            <span className="sort-indicator">
                                {column.isSorted ? (column.isSortedDesc ? ' ▼' : ' ▲') : ''}
                            </span>
                        </th>
                    ))}
                </tr>
            ))}
        </thead>
        <tbody {...getTableBodyProps()}>
            {/* Row rendering */}
        </tbody>
    </table>
</div>
```

### 2. Empty State
```jsx
if (rows.length === 0) {
    return (
        <div className="empty-state">
            <div className="empty-icon">📊</div>
            <h3>No Transactions Yet</h3>
            <p>Start by creating your first transaction!</p>
        </div>
    );
}
```

## Styling

### 1. Table Styling
```css
.transaction-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 1rem;
}

.transaction-amount {
    font-weight: 600;
}

.transaction-amount.expense {
    color: var(--error);
}

.transaction-amount.income {
    color: var(--success);
}
```

### 2. Action Buttons
```css
.action-btn {
    padding: 0.5rem;
    margin: 0 0.25rem;
    border-radius: var(--border-radius);
    transition: all 0.2s ease;
}

.action-btn.edit:hover {
    background-color: var(--primary-hover);
}

.action-btn.delete:hover {
    background-color: var(--error-hover);
}
```

## Accessibility Features

### 1. ARIA Attributes
```jsx
<div role="region" aria-label="Transactions list">
    <button
        aria-label={`Edit transaction: ${description}`}
    >
        Edit
    </button>
</div>
```

### 2. Keyboard Navigation
- Sortable headers
- Focusable action buttons
- Proper tab order
- Clear focus indicators

## Performance Considerations

### 1. Memoization
- Memoized column definitions
- Memoized data transformation
- Optimized re-renders

### 2. Data Handling
- Efficient data processing
- Optimized sorting
- Controlled updates

## Usage Example
```jsx
import TransactionList from './components/Transaction/transactionList';

function MyComponent() {
    const handleEdit = (transaction) => {
        // Handle edit
    };
    
    const handleDelete = (transactionId) => {
        // Handle delete
    };
    
    return (
        <TransactionList
            transactions={transactions}
            onEdit={handleEdit}
            onDelete={handleDelete}
            wallets={wallets}
            savingsAccounts={savingsAccounts}
        />
    );
}
```

## Best Practices

### 1. Data Management
- Proper data validation
- Error handling
- Type checking
- Null checks

### 2. User Experience
- Clear sorting indicators
- Responsive design
- Visual feedback
- Confirmation dialogs

### 3. Performance
- Efficient rendering
- Optimized sorting
- Controlled updates
- Memory management
