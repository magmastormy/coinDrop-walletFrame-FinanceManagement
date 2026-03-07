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
    const normalizedType = wallet.type?.toLowerCase();

    const typeStyles = {
        'credit card': "from-rose-500/20 to-orange-400/15 text-rose-500 border-rose-500/20",
        savings: "from-emerald-500/20 to-cyan-400/15 text-emerald-500 border-emerald-500/20",
        bank: "from-blue-500/20 to-cyan-500/15 text-blue-500 border-blue-500/20",
        cash: "from-violet-500/20 to-fuchsia-400/15 text-violet-500 border-violet-500/20"
    };

    const walletTheme = typeStyles[normalizedType] || "from-primary/20 to-cyan-500/15 text-primary border-primary/20";

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    return (
        <>
            <GlassCard
                className="group relative h-full min-h-[292px] overflow-visible border border-white/15 bg-gradient-to-b from-white/30 via-white/10 to-transparent p-5 transition-all duration-300 hover:translate-y-[-4px] dark:from-white/10 dark:via-white/5"
                hoverEffect={true}
            >
                <div className="flex h-full flex-col gap-4">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className={cn(
                                "rounded-2xl border bg-gradient-to-br p-3.5",
                                walletTheme
                            )}>
                                <Icon className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-foreground">{wallet.name}</p>
                                <p className="mt-0.5 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                                    {wallet.type}
                                </p>
                            </div>
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
                                        className="absolute right-0 top-full z-20 mt-2 w-48 overflow-hidden rounded-xl border border-white/20 bg-white/90 p-1 shadow-xl backdrop-blur-xl dark:bg-gray-900/90"
                                    >
                                        <button
                                            onClick={() => { setShowEditModal(true); setShowMenu(false); }}
                                            className="w-full rounded-lg px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-black/5 dark:hover:bg-white/10"
                                        >
                                            <span className="flex items-center gap-2"><Edit2 className="w-4 h-4" /> Edit</span>
                                        </button>
                                        <button
                                            onClick={() => { setShowTransferModal(true); setShowMenu(false); }}
                                            className="w-full rounded-lg px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-black/5 dark:hover:bg-white/10"
                                        >
                                            <span className="flex items-center gap-2"><ArrowRightLeft className="w-4 h-4" /> Transfer</span>
                                        </button>
                                        <button
                                            onClick={() => { setShowReportModal(true); setShowMenu(false); }}
                                            className="w-full rounded-lg px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-black/5 dark:hover:bg-white/10"
                                        >
                                            <span className="flex items-center gap-2"><FileText className="w-4 h-4" /> Report</span>
                                        </button>
                                        <div className="my-1 h-px bg-border" />
                                        <button
                                            onClick={() => { setShowDeleteDialog(true); setShowMenu(false); }}
                                            disabled={wallet.isSystemWallet && wallet.balance > 0}
                                            className="w-full rounded-lg px-3 py-2 text-left text-sm text-red-500 transition-colors hover:bg-red-50 disabled:opacity-50 dark:hover:bg-red-900/20"
                                        >
                                            <span className="flex items-center gap-2">
                                                {wallet.isSystemWallet ? <Shield className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
                                                {wallet.isSystemWallet ? 'Protected' : 'Delete'}
                                            </span>
                                        </button>
                                    </motion.div>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="mt-3 rounded-2xl border border-white/10 bg-background/40 p-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Current Balance</p>
                        <h3 className={cn(
                            "mt-2 text-3xl font-display font-bold",
                            wallet.balance < 0 ? "text-red-500" : "text-foreground"
                        )}>
                            {formatCurrency(wallet.balance)}
                        </h3>
                    </div>

                    <div className="mt-auto flex items-center justify-between border-t border-white/10 pt-4 text-xs text-muted-foreground">
                        <span>Account Type</span>
                        <span className="rounded-full border border-white/15 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.14em]">
                            {wallet.type}
                        </span>
                    </div>
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
