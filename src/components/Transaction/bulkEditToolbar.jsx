import React from 'react';
import { Check, X, Trash2, Tag } from 'lucide-react';

const BulkEditToolbar = ({ 
    selectedCount,
    onCategoryChange,
    onDelete,
    onCancel,
    categories = []
}) => {
    return (
        <div 
            className="glass-card flex items-center justify-between p-4"
            style={{ borderRadius: '1rem' }}
        >
            <div className="flex items-center gap-2">
                <div 
                    className="w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: 'var(--fc-secondary)' }}
                >
                    <Check className="w-3 h-3" style={{ color: 'var(--fc-on-secondary)' }} />
                </div>
                <span className="text-sm font-medium" style={{ color: 'var(--fc-on-surface)' }}>
                    {selectedCount} transaction{selectedCount !== 1 ? 's' : ''} selected
                </span>
            </div>

            <div className="flex items-center gap-3">
                {/* Category Change Dropdown */}
                <div 
                    className="flex items-center gap-2 px-3 py-2 rounded-lg"
                    style={{ 
                        backgroundColor: 'var(--fc-surface-container-high)',
                        border: '1px solid var(--fc-outline-variant)'
                    }}
                >
                    <Tag className="w-4 h-4" style={{ color: 'var(--fc-on-tertiary-container)' }} />
                    <select
                        onChange={(e) => onCategoryChange(e.target.value)}
                        className="bg-transparent border-none focus:ring-0 text-sm cursor-pointer"
                        style={{ color: 'var(--fc-on-surface)' }}
                        defaultValue=""
                    >
                        <option value="" disabled>Change category</option>
                        {categories.map(c => (
                            <option key={c._id} value={c._id}>{c.name}</option>
                        ))}
                    </select>
                </div>

                {/* Delete Button */}
                <button
                    onClick={onDelete}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors hover:opacity-90"
                    style={{ 
                        backgroundColor: 'var(--fc-error-container)',
                        color: 'var(--fc-error)'
                    }}
                >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                </button>

                {/* Cancel Button */}
                <button
                    onClick={onCancel}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                    style={{ 
                        backgroundColor: 'var(--fc-surface-container-high)',
                        color: 'var(--fc-on-surface-variant)',
                        border: '1px solid var(--fc-outline-variant)'
                    }}
                >
                    <X className="w-4 h-4" />
                    <span>Cancel</span>
                </button>
            </div>
        </div>
    );
};

export default BulkEditToolbar;
