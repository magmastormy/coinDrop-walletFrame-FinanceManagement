import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit2, ArrowRightLeft, FileText, Trash2, Shield, MoreVertical } from 'lucide-react';
import { cn } from '../../lib/utils';
import EditWalletModal from './editWallet';
import WalletTransfer from './walletTransfer';
import DeleteWalletDialog from './deleteWalletDialog';
import ReportButton from '../Common/reportButton';

// Material Symbols Icon component
const MaterialIcon = ({ name, className = '', filled = false }) => (
    <span 
        className={`material-symbols-outlined ${className}`}
        style={{ fontVariationSettings: filled ? "'FILL' 1" : "'FILL' 0" }}
    >
        {name}
    </span>
);

// Wallet type to icon mapping using Material Symbols
const getWalletIcon = (type) => {
    const typeMap = {
        'cash': { icon: 'payments', color: 'text-primary', bgColor: 'bg-primary/10' },
        'credit card': { icon: 'credit_card', color: 'text-primary', bgColor: 'bg-primary/10' },
        'bank': { icon: 'account_balance', color: 'text-primary', bgColor: 'bg-primary/10' },
        'savings': { icon: 'savings', color: 'text-secondary', bgColor: 'bg-secondary/10' },
        'investment': { icon: 'trending_up', color: 'text-secondary', bgColor: 'bg-secondary/10' },
        'loan': { icon: 'credit_score', color: 'text-tertiary', bgColor: 'bg-tertiary/10' },
        'other': { icon: 'wallet', color: 'text-tertiary', bgColor: 'bg-tertiary/10' }
    };
    return typeMap[type?.toLowerCase()] || { icon: 'account_balance_wallet', color: 'text-primary', bgColor: 'bg-primary/10' };
};

const WalletCard = ({ wallet, wallets, onUpdate, onDelete, onTransfer, viewMode = 'grid' }) => {
    const [showMenu, setShowMenu] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);

    const walletIcon = useMemo(() => getWalletIcon(wallet.type), [wallet.type]);
    const otherWallets = useMemo(() => wallets.filter(w => w._id !== wallet._id), [wallets, wallet._id]);

    const formatCurrency = useCallback((amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    }, []);

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        const now = new Date();
        const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return 'Updated Today';
        if (diffDays === 1) return 'Updated Yesterday';
        if (diffDays < 7) return `Updated ${diffDays} days ago`;
        return `Updated ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    };

    const handleCardClick = (e) => {
        // Prevent card click when clicking menu or buttons
        if (e.target.closest('.wallet-menu') || e.target.closest('.wallet-action')) {
            return;
        }
    };

    if (viewMode === 'list') {
        return (
            <>
                <div 
                    className="group relative overflow-hidden bg-surface-container-low p-4 rounded-2xl border border-outline-variant/5 transition-all duration-300 hover:bg-surface-container flex items-center gap-4"
                    onClick={handleCardClick}
                >
                    {/* Icon */}
                    <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                        walletIcon.bgColor,
                        walletIcon.color
                    )}>
                        <MaterialIcon name={walletIcon.icon} className="text-2xl" filled />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                        <h4 className="text-lg font-bold text-on-surface truncate">{wallet.name}</h4>
                        <p className="text-on-tertiary-container text-xs capitalize">{wallet.type}</p>
                    </div>

                    {/* Balance */}
                    <div className="text-right shrink-0">
                        <p className={cn(
                            "text-xl font-bold font-headline",
                            wallet.balance < 0 ? "text-error" : "text-on-surface"
                        )}>
                            {formatCurrency(wallet.balance)}
                        </p>
                        <p className="text-[10px] text-on-tertiary-container font-medium uppercase tracking-tighter">
                            {formatDate(wallet.updatedAt)}
                        </p>
                    </div>

                    {/* Action Menu */}
                    <div className="relative wallet-menu shrink-0">
                        <button
                            className="p-2 text-on-tertiary-container hover:text-on-surface transition-colors rounded-full hover:bg-surface-container-high"
                            onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                        >
                            <MoreVertical className="w-5 h-5" />
                        </button>

                        <AnimatePresence>
                            {showMenu && (
                                <>
                                    <motion.div 
                                        className="fixed inset-0 z-10" 
                                        onClick={() => setShowMenu(false)}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                    />
                                    <motion.div
                                        initial={{ opacity: 0, y: 5, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 5, scale: 0.95 }}
                                        transition={{ duration: 0.15 }}
                                        className="absolute right-0 mt-1 w-48 z-20 bg-surface-container-high rounded-xl border border-outline-variant/10 py-1 shadow-xl"
                                    >
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setShowEditModal(true); setShowMenu(false); }}
                                            className="w-full text-left px-4 py-2 text-sm text-on-surface hover:bg-surface-container flex items-center gap-2 transition-colors"
                                        >
                                            <Edit2 className="w-4 h-4" /> Edit Wallet
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setShowTransferModal(true); setShowMenu(false); }}
                                            className="w-full text-left px-4 py-2 text-sm text-on-surface hover:bg-surface-container flex items-center gap-2 transition-colors"
                                        >
                                            <ArrowRightLeft className="w-4 h-4" /> Transfer Funds
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setShowReportModal(true); setShowMenu(false); }}
                                            className="w-full text-left px-4 py-2 text-sm text-on-surface hover:bg-surface-container flex items-center gap-2 transition-colors"
                                        >
                                            <FileText className="w-4 h-4" /> Generate Report
                                        </button>
                                        <div className="border-t border-outline-variant/10 my-1" />
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setShowDeleteDialog(true); setShowMenu(false); }}
                                            disabled={wallet.isSystemWallet && wallet.balance > 0}
                                            className={cn(
                                                "w-full text-left px-4 py-2 text-sm flex items-center gap-2 transition-colors",
                                                wallet.isSystemWallet 
                                                    ? "text-on-tertiary-container cursor-not-allowed" 
                                                    : "text-error hover:bg-error/10"
                                            )}
                                        >
                                            {wallet.isSystemWallet 
                                                ? <Shield className="w-4 h-4" /> 
                                                : <Trash2 className="w-4 h-4" />}
                                            {wallet.isSystemWallet ? 'Protected' : 'Delete Wallet'}
                                        </button>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Modals */}
                <EditWalletModal
                    isOpen={showEditModal}
                    onClose={() => setShowEditModal(false)}
                    wallet={wallet}
                    onUpdate={onUpdate}
                />

                <WalletTransfer
                    isOpen={showTransferModal}
                    onClose={() => setShowTransferModal(false)}
                    sourceWallet={wallet}
                    wallets={otherWallets}
                    onTransfer={onTransfer}
                />

                <DeleteWalletDialog
                    isOpen={showDeleteDialog}
                    onClose={() => setShowDeleteDialog(false)}
                    wallet={wallet}
                    otherWallets={otherWallets}
                    onConfirm={onDelete}
                    isSystemWallet={wallet.isSystemWallet}
                />

                {showReportModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-surface-container-high rounded-2xl max-w-md w-full p-6 shadow-xl border border-outline-variant/10"
                        >
                            <h3 className="text-lg font-semibold mb-4 text-on-surface">Wallet Report</h3>
                            <ReportButton
                                accountId={wallet._id}
                                reportType="wallet-summary"
                                className="w-full"
                            />
                            <button
                                className="w-full mt-4 px-4 py-2 rounded-lg border border-outline-variant text-on-surface hover:bg-surface-container transition-colors"
                                onClick={() => setShowReportModal(false)}
                            >
                                Close
                            </button>
                        </motion.div>
                    </div>
                )}
            </>
        );
    }

    // Grid View (default)
    return (
        <>
            <div 
                className="group relative overflow-hidden bg-surface-container-low p-6 rounded-2xl border border-outline-variant/5 transition-all duration-300 hover:bg-surface-container h-full flex flex-col"
                onClick={handleCardClick}
            >
                {/* More Options - appears on hover */}
                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity wallet-menu">
                    <button
                        className="p-1 text-on-tertiary-container hover:text-on-surface transition-colors rounded-full hover:bg-surface-container-high"
                        onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                    >
                        <MaterialIcon name="more_vert" className="text-xl" />
                    </button>

                    <AnimatePresence>
                        {showMenu && (
                            <>
                                <motion.div 
                                    className="fixed inset-0 z-10" 
                                    onClick={() => setShowMenu(false)}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                />
                                <motion.div
                                    initial={{ opacity: 0, y: 5, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 5, scale: 0.95 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute right-0 mt-1 w-48 z-20 bg-surface-container-high rounded-xl border border-outline-variant/10 py-1 shadow-xl"
                                >
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setShowEditModal(true); setShowMenu(false); }}
                                        className="w-full text-left px-4 py-2 text-sm text-on-surface hover:bg-surface-container flex items-center gap-2 transition-colors"
                                    >
                                        <Edit2 className="w-4 h-4" /> Edit Wallet
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setShowTransferModal(true); setShowMenu(false); }}
                                        className="w-full text-left px-4 py-2 text-sm text-on-surface hover:bg-surface-container flex items-center gap-2 transition-colors"
                                    >
                                        <ArrowRightLeft className="w-4 h-4" /> Transfer Funds
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setShowReportModal(true); setShowMenu(false); }}
                                        className="w-full text-left px-4 py-2 text-sm text-on-surface hover:bg-surface-container flex items-center gap-2 transition-colors"
                                    >
                                        <FileText className="w-4 h-4" /> Generate Report
                                    </button>
                                    <div className="border-t border-outline-variant/10 my-1" />
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setShowDeleteDialog(true); setShowMenu(false); }}
                                        disabled={wallet.isSystemWallet && wallet.balance > 0}
                                        className={cn(
                                            "w-full text-left px-4 py-2 text-sm flex items-center gap-2 transition-colors",
                                            wallet.isSystemWallet 
                                                ? "text-on-tertiary-container cursor-not-allowed" 
                                                : "text-error hover:bg-error/10"
                                        )}
                                    >
                                        {wallet.isSystemWallet 
                                            ? <Shield className="w-4 h-4" /> 
                                            : <Trash2 className="w-4 h-4" />}
                                        {wallet.isSystemWallet ? 'Protected' : 'Delete Wallet'}
                                    </button>
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </div>

                {/* Icon */}
                <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center mb-6",
                    walletIcon.bgColor,
                    walletIcon.color
                )}>
                    <MaterialIcon name={walletIcon.icon} className="text-2xl" filled />
                </div>

                {/* Wallet Info */}
                <h4 className="text-lg font-bold mb-1 text-on-surface">{wallet.name}</h4>
                <p className="text-on-tertiary-container text-xs mb-6 capitalize">{wallet.type}</p>

                {/* Balance */}
                <div className="space-y-1 mt-auto">
                    <p className={cn(
                        "text-2xl font-bold font-headline",
                        wallet.balance < 0 ? "text-error" : "text-on-surface"
                    )}>
                        {formatCurrency(wallet.balance)}
                    </p>
                    <p className="text-[10px] text-on-tertiary-container font-medium uppercase tracking-tighter">
                        {formatDate(wallet.updatedAt)}
                    </p>
                </div>
            </div>

            {/* Modals */}
            <EditWalletModal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                wallet={wallet}
                onUpdate={onUpdate}
            />

            <WalletTransfer
                isOpen={showTransferModal}
                onClose={() => setShowTransferModal(false)}
                sourceWallet={wallet}
                wallets={otherWallets}
                onTransfer={onTransfer}
            />

            <DeleteWalletDialog
                isOpen={showDeleteDialog}
                onClose={() => setShowDeleteDialog(false)}
                wallet={wallet}
                otherWallets={otherWallets}
                onConfirm={onDelete}
                isSystemWallet={wallet.isSystemWallet}
            />

            {showReportModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-surface-container-high rounded-2xl max-w-md w-full p-6 shadow-xl border border-outline-variant/10"
                    >
                        <h3 className="text-lg font-semibold mb-4 text-on-surface">Wallet Report</h3>
                        <ReportButton
                            accountId={wallet._id}
                            reportType="wallet-summary"
                            className="w-full"
                        />
                        <button
                            className="w-full mt-4 px-4 py-2 rounded-lg border border-outline-variant text-on-surface hover:bg-surface-container transition-colors"
                            onClick={() => setShowReportModal(false)}
                        >
                            Close
                        </button>
                    </motion.div>
                </div>
            )}
        </>
    );
};

export default React.memo(WalletCard);
