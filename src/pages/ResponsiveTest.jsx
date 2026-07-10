import { logInfo } from '../utils/logger';

import React, { useState } from 'react';
import TransactionTable from '../components/Transaction/transactionTable';
import SavingsAccountTransactionTable from '../components/Savings/savingsAccountTransactionTable';
import { ProgressBar } from '../components/ui/ProgressBar';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';

const ResponsiveTest = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeComponent, setActiveComponent] = useState('transactionTable');

  // Mock data for testing
  const mockTransactions = [
    {
      _id: '1',
      description: 'Salary',
      amount: 5000,
      type: 'income',
      date: new Date().toISOString(),
      walletId: 'wallet1'
    },
    {
      _id: '2',
      description: 'Groceries',
      amount: 100,
      type: 'expense',
      date: new Date().toISOString(),
      walletId: 'wallet1'
    },
    {
      _id: '3',
      description: 'Transfer to Savings',
      amount: 500,
      type: 'transfer',
      date: new Date().toISOString(),
      walletId: 'wallet1',
      savingsAccountId: 'savings1'
    }
  ];

  const mockWallets = [
    { _id: 'wallet1', name: 'Main Wallet' }
  ];

  const mockSavingsAccounts = [
    { _id: 'savings1', name: 'Emergency Fund' }
  ];

  const handleEdit = (transaction) => {
    logInfo('Edit transaction:', transaction);
  };

  const handleDelete = (id) => {
    logInfo('Delete transaction:', id);
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 bg-background">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Responsive Components Test</h1>
        
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Test Different Components</h2>
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={() => setActiveComponent('transactionTable')}
              variant={activeComponent === 'transactionTable' ? 'default' : 'outline'}
            >
              Transaction Table
            </Button>
            <Button 
              onClick={() => setActiveComponent('savingsTable')}
              variant={activeComponent === 'savingsTable' ? 'default' : 'outline'}
            >
              Savings Account Table
            </Button>
            <Button 
              onClick={() => setActiveComponent('progressBar')}
              variant={activeComponent === 'progressBar' ? 'default' : 'outline'}
            >
              Progress Bar
            </Button>
            <Button 
              onClick={() => setIsModalOpen(true)}
              variant="default"
            >
              Open Modal
            </Button>
          </div>
        </div>

        <div className="space-y-8">
          {activeComponent === 'transactionTable' && (
            <div
              style={{
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                background: 'var(--color-surface-1)',
                padding: '24px',
              }}
            >
              <h3 className="text-lg font-semibold mb-4">Transaction Table</h3>
              <TransactionTable
                transactions={mockTransactions}
                onEdit={handleEdit}
                onDelete={handleDelete}
                wallets={mockWallets}
                savingsAccounts={mockSavingsAccounts}
              />
            </div>
          )}

          {activeComponent === 'savingsTable' && (
            <div
              style={{
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                background: 'var(--color-surface-1)',
                padding: '24px',
              }}
            >
              <h3 className="text-lg font-semibold mb-4">Savings Account Transaction Table</h3>
              <SavingsAccountTransactionTable
                accountId="savings1"
                wallets={mockWallets}
                savingsAccounts={mockSavingsAccounts}
              />
            </div>
          )}

          {activeComponent === 'progressBar' && (
            <div
              className="space-y-6"
              style={{
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                background: 'var(--color-surface-1)',
                padding: '24px',
              }}
            >
              <h3 className="text-lg font-semibold">Progress Bar</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2">Primary Progress Bar</p>
                  <ProgressBar value={65} max={100} />
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Success Progress Bar</p>
                  <ProgressBar value={80} max={100} variant="success" />
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Warning Progress Bar</p>
                  <ProgressBar value={45} max={100} variant="warning" />
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Danger Progress Bar</p>
                  <ProgressBar value={20} max={100} variant="danger" />
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Large Progress Bar</p>
                  <ProgressBar value={75} max={100} size="lg" />
                </div>
              </div>
            </div>
          )}
        </div>

        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Test Modal"
          size="medium"
        >
          <div className="space-y-4">
            <p>This is a test modal to check responsiveness.</p>
            <p>Resize your browser window to see how the modal adjusts to different screen sizes.</p>
            <Button onClick={() => setIsModalOpen(false)} className="w-full">
              Close Modal
            </Button>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default ResponsiveTest;