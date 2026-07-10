import { logError, logWarn } from '../../utils/logger';

import React, { useState } from 'react';
import { Loader2, X, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import Modal from '../ui/Modal';
import transactionService from '../../services/transactionService';

const CsvImportModal = ({ isOpen, onClose, onImportComplete }) => {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            previewCSV(selectedFile);
        }
    };

    const previewCSV = (csvFile) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const csvContent = e.target.result;
                
                // Validate CSV content
                if (!csvContent || typeof csvContent !== 'string') {
                    throw new Error('Invalid CSV content provided');
                }

                const lines = csvContent.split('\n').filter(line => line.trim());
                if (lines.length < 2) {
                    throw new Error('CSV must have at least a header and one data row');
                }

                const headers = lines[0].split(',').map(header => header.trim());
                if (!headers || headers.length === 0) {
                    throw new Error('CSV headers cannot be empty');
                }

                const transactions = [];
                let lineNumber = 1;

                for (let i = 1; i < lines.length; i++) {
                    const line = lines[i].trim();
                    if (!line) continue;

                    const values = line.split(',').map(value => value.trim());
                    if (values.length !== headers.length) {
                        logWarn(`Row ${i + 1} has ${values.length} values but expected ${headers.length} columns. Skipping row.`);
                        continue;
                    }

                    const transaction = {};
                    headers.forEach((header, index) => {
                        transaction[header.trim()] = values[index]?.trim() || '';
                    });

                    // Validate required fields
                    if (!transaction.amount || isNaN(parseFloat(transaction.amount))) {
                        logWarn(`Row ${i + 1}: Invalid amount. Skipping row.`);
                        continue;
                    }

                    if (!transaction.date) {
                        logWarn(`Row ${i + 1}: Invalid date. Skipping row.`);
                        continue;
                    }

                    transactions.push(transaction);
                    lineNumber++;
                }

                setPreview(transactions.slice(0, 5)); // Show first 5 rows as preview
                setError('');
            } catch (err) {
                logError('CSV parsing error:', err);
                setError('Invalid CSV format. Please check your file and try again.');
                setPreview([]);
            }
        };
        reader.readAsText(csvFile);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file) {
            setError('Please select a CSV file to import');
            return;
        }

        setIsLoading(true);
        setError('');
        setSuccess('');

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await transactionService.importTransactionsFromCSV(formData);
            setSuccess(`Successfully imported ${response.importedCount} transactions`);
            setPreview([]);
            setFile(null);
            
            // Notify parent component
            onImportComplete && onImportComplete(response.importedCount);
        } catch (err) {
            setError(err.message || 'Failed to import transactions');
        } finally {
            setIsLoading(false);
        }
    };

    const inputStyles = {
        backgroundColor: 'var(--fc-surface-container-low)',
        border: '1px solid var(--fc-outline-variant)',
        color: 'var(--fc-on-surface)',
        borderRadius: '0.75rem'
    };

    const labelStyles = {
        color: 'var(--fc-on-tertiary-container)',
        fontSize: '0.875rem',
        fontWeight: 500,
        marginBottom: '0.375rem',
        display: 'block'
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Import Transactions from CSV"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                    <div 
                        className="p-4 rounded-lg flex items-start gap-3"
                        style={{ 
                            backgroundColor: 'var(--fc-error-container)',
                            color: 'var(--fc-error)'
                        }}
                    >
                        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-semibold mb-1">Error</h4>
                            <p className="text-sm">{error}</p>
                        </div>
                    </div>
                )}

                {success && (
                    <div 
                        className="p-4 rounded-lg flex items-start gap-3"
                        style={{ 
                            backgroundColor: 'var(--fc-secondary-container)',
                            color: 'var(--fc-on-secondary-container)'
                        }}
                    >
                        <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-semibold mb-1">Success</h4>
                            <p className="text-sm">{success}</p>
                        </div>
                    </div>
                )}

                <div>
                    <label style={labelStyles}>CSV File</label>
                    <div 
                        className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors hover:bg-surface-container"
                        style={{ 
                            borderColor: 'var(--fc-outline-variant)',
                            backgroundColor: 'var(--fc-surface-container-low)'
                        }}
                        onClick={() => document.getElementById('csv-file-input').click()}
                    >
                        <input
                            id="csv-file-input"
                            type="file"
                            accept=".csv"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                        <Upload className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--fc-primary)' }} />
                        <h4 className="font-medium mb-2" style={{ color: 'var(--fc-on-surface)' }}>
                            {file ? file.name : 'Drag and drop your CSV file here'}
                        </h4>
                        <p className="text-sm" style={{ color: 'var(--fc-on-tertiary-container)' }}>
                            or click to browse
                        </p>
                        <p className="text-xs mt-2" style={{ color: 'var(--fc-on-tertiary-container)' }}>
                            Supported format: CSV files with columns for amount, type, description, date, etc.
                        </p>
                    </div>
                </div>

                {preview.length > 0 && (
                    <div>
                        <label style={labelStyles}>Preview (First 5 rows)</label>
                        <div 
                            className="rounded-lg overflow-hidden"
                            style={{ 
                                backgroundColor: 'var(--fc-surface-container)',
                                border: '1px solid var(--fc-outline-variant)'
                            }}
                        >
                            <div className="grid grid-cols-4 px-4 py-3 text-xs font-semibold uppercase tracking-wider"
                                style={{ 
                                    backgroundColor: 'var(--fc-surface-container-high)',
                                    color: 'var(--fc-on-tertiary-container)'
                                }}
                            >
                                <div>Amount</div>
                                <div>Type</div>
                                <div>Description</div>
                                <div>Date</div>
                            </div>
                            {preview.map((item, index) => (
                                <div key={index} className="grid grid-cols-4 px-4 py-3 text-sm border-t border-outline-variant"
                                    style={{ color: 'var(--fc-on-surface)' }}
                                >
                                    <div>{item.amount || '-'}</div>
                                    <div>{item.type || '-'}</div>
                                    <div className="truncate">{item.description || '-'}</div>
                                    <div>{item.date || '-'}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex gap-3 pt-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 px-4 py-2 rounded-lg font-medium transition-colors"
                        style={{ 
                            backgroundColor: 'var(--fc-surface-container-high)',
                            color: 'var(--fc-on-surface-variant)',
                            border: '1px solid var(--fc-outline-variant)'
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading || !file}
                        className="cta-gradient flex-1 px-4 py-2 rounded-lg font-bold flex items-center justify-center gap-2"
                    >
                        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                        Import Transactions
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default CsvImportModal;