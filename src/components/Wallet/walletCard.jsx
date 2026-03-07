import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Wallet, CreditCard, Building2, PiggyBank, MoreVertical,
    Trash2, Edit2, ArrowRightLeft, FileText, Shield
} from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';
import EditWalletModal from './editWallet';
import WalletTransfer from './walletTransfer';
import DeleteWalletDialog from './deleteWalletDialog';
import ReportButton from '../Common/reportButton';

const WalletCard = ({ wallet, wallets, onUpdate, onDelete, onTransfer }) => {
    const [showMenu, setShowMenu] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);

    const getIcon = (type) => {
        switch (type?.toLowerCase()) {
            case 'cash': return Wallet;
            case 'credit card': return CreditCard;
            case 'bank': return Building2;
            case 'savings': return PiggyBank;
            default: return Wallet;
        }
    };

    const Icon = getIcon(wallet.type);
    const otherWallets = wallets.filter(w => w._id !== wallet._id);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    return (
        <>
            <GlassCard
                className="relative group overflow-visible transition-all duration-300 hover:translate-y-[-4px]"
                hoverEffect={true}
            >
                <div className="flex justify-between items-start mb-6">
                    <div className={cn(
                        "p-3 rounded-xl bg-gradient-to-br",
                        wallet.type === 'credit card' ? "from-purple-500/20 to-pink-500/20 text-purple-500" :
                            wallet.type === 'savings' ? "from-green-500/20 to-emerald-500/20 text-green-500" :
                                "from-blue-500/20 to-cyan-500/20 text-blue-500"
                    )}>
                        <Icon className="w-6 h-6" />
                    </div>
                    <div className="relative">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setShowMenu(!showMenu)}
                        >
                            <MoreVertical className="w-4 h-4" />
                        </Button>

                        {showMenu && (
                            <>
                                <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setShowMenu(false)}
                                />
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    className="absolute right-0 top-full mt-2 w-48 z-20 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-white/20 rounded-xl shadow-xl overflow-hidden p-1"
                                >
                                    <button
                                        onClick={() => { setShowEditModal(true); setShowMenu(false); }}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors"
                                    >
                                        <Edit2 className="w-4 h-4" /> Edit
                                    </button>
                                    <button
                                        onClick={() => { setShowTransferModal(true); setShowMenu(false); }}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors"
                                    >
                                        <ArrowRightLeft className="w-4 h-4" /> Transfer
                                    </button>
                                    <button
                                        onClick={() => { setShowReportModal(true); setShowMenu(false); }}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors"
                                    >
                                        <FileText className="w-4 h-4" /> Report
                                    </button>
                                    <div className="h-px bg-border my-1" />
                                    <button
                                        onClick={() => { setShowDeleteDialog(true); setShowMenu(false); }}
                                        disabled={wallet.isSystemWallet && wallet.balance > 0}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                                    >
                                        {wallet.isSystemWallet ? <Shield className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
                                        {wallet.isSystemWallet ? 'Protected' : 'Delete'}
                                    </button>
                                </motion.div>
                            </>
                        )}
                    </div>
                </div>

                <div>
                    <p className="text-sm text-muted-foreground font-medium mb-1">{wallet.name}</p>
                    <h3 className={cn(
                        "text-2xl font-display font-bold",
                        wallet.balance < 0 ? "text-red-500" : "text-foreground"
                    )}>
                        {formatCurrency(wallet.balance)}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-2 capitalize">{wallet.type}</p>
                </div>
            </GlassCard>

            {/* Legacy Modals - To be refactored later if needed, or kept as wrappers */}
            {showEditModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-background rounded-xl p-6 max-w-md w-full m-4">
                        <EditWalletModal
                            wallet={wallet}
                            onClose={() => setShowEditModal(false)}
                            onUpdate={onUpdate}
                        />
                    </div>
                </div>
            )}

            {showTransferModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-background rounded-xl p-6 max-w-md w-full m-4">
                        <WalletTransfer
                            sourceWallet={wallet}
                            wallets={wallets}
                            onClose={() => setShowTransferModal(false)}
                            onTransfer={onTransfer}
                        />
                    </div>
                </div>
            )}

            {showDeleteDialog && (
                <DeleteWalletDialog
                    isOpen={showDeleteDialog}
                    onClose={() => setShowDeleteDialog(false)}
                    onConfirm={onDelete}
                    wallet={wallet}
                    otherWallets={otherWallets}
                    isSystemWallet={wallet.isSystemWallet && wallet.balance > 0}
                />
            )}

            {showReportModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-background rounded-xl p-6 max-w-md w-full m-4">
                        <h3 className="text-lg font-bold mb-4">Generate Wallet Report</h3>
                        <ReportButton
                            accountId={wallet._id}
                            label="Generate Report"
                            defaultReportType="wallet-report"
                            isGlobal={false}
                        />
                        <Button
                            variant="outline"
                            className="w-full mt-4"
                            onClick={() => setShowReportModal(false)}
                        >
                            Close
                        </Button>
                    </div>
                </div>
            )}
        </>
    );
};

export default WalletCard;
