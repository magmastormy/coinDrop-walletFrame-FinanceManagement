import React from 'react';
import { createRoot } from 'react-dom/client';
import TransactionTable from '../src/components/Transaction/transactionTable';

const mockTransactions = [
  {
    _id: '1',
    amount: 100,
    type: 'income',
    description: 'Salary',
    date: '2026-03-01',
    walletId: { _id: 'wallet1', name: 'Main Wallet' }
  },
  {
    _id: '2',
    amount: 50,
    type: 'expense',
    description: 'Groceries',
    date: '2026-03-02',
    walletId: { _id: 'wallet1', name: 'Main Wallet' }
  }
];

const App = () => (
  <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
    <h1>Transaction Table Preview</h1>
    <TransactionTable 
      transactions={mockTransactions}
      onEdit={() => console.log('Edit clicked')}
      onDelete={() => console.log('Delete clicked')}
    />
  </div>
);

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);