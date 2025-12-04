import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { Plus, Check, X, AlertTriangle, Loader } from 'lucide-react';
import { setCategories, setLoading, setError } from '../../slices/categorySlice';
import categoryService from '../../services/categoryService';
import transactionService from '../../services/transactionService';
import CategoryPanel from './categoryPanel';
import ExpensesByCategoryChart from './expensesbycategoryChart';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { GlassCard } from '../ui/GlassCard';

const CategoryManager = () => {
    const dispatch = useDispatch();
    const { categories, loading, error } = useSelector(state => state.category);
    const { user } = useSelector(state => state.auth);
    const [newCategory, setNewCategory] = useState('');
    const [editingCategory, setEditingCategory] = useState(null);
    const [, setDeleteConfirm] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [txLoading, setTxLoading] = useState(false);
    const [txError, setTxError] = useState(null);

    useEffect(() => {
        fetchCategories();
    }, [dispatch]);

    useEffect(() => {
        if (user && user.id) loadTransactions();
    }, [user]);

    const fetchCategories = async () => {
        dispatch(setLoading(true));
        try {
            if (!user || !user.id) {
                throw new Error('User not authenticated');
            }
            const fetchedCategories = await categoryService.getUserCategories(user.id);
            dispatch(setCategories(fetchedCategories));
        } catch (err) {
            dispatch(setError(err.message));
        } finally {
            dispatch(setLoading(false));
        }
    };

    const handleCreateCategory = async (e) => {
        e.preventDefault();
        if (!newCategory.trim()) return;

        try {
            const categoryData = { name: newCategory.trim() };
            await categoryService.createCategory(categoryData);
            fetchCategories();
            setNewCategory('');
        } catch (err) {
            dispatch(setError(err.message));
        }
    };

    const handleEditCategory = async (e) => {
        e.preventDefault();
        if (!newCategory.trim()) return;

        try {
            const categoryData = { name: newCategory.trim() };
            await categoryService.updateCategory(editingCategory._id, categoryData);
            fetchCategories();
            setNewCategory('');
            setEditingCategory(null);
        } catch (err) {
            dispatch(setError(err.message));
        }
    };

    const handleDeleteCategory = async (categoryId) => {
        try {
            await categoryService.deleteCategory(categoryId);
            fetchCategories();
            setDeleteConfirm(null);
        } catch (err) {
            dispatch(setError(err.message));
        }
    };

    const handleEditClick = (category) => {
        setNewCategory(category.name);
        setEditingCategory(category);
        setDeleteConfirm(null);
    };

    const handleCancelEdit = () => {
        setNewCategory('');
        setEditingCategory(null);
    };

    const loadTransactions = async () => {
        setTxLoading(true);
        try {
            const res = await transactionService.getUserTransactions(user.id);
            console.log("[CategoryManager - loadTransactions] transaction: ", res);
            setTransactions(res.transactions || []);
        } catch (err) {
            setTxError(err.message);
        } finally {
            setTxLoading(false);
        }
    };

    return (
        <motion.div
            className="container mx-auto px-4 py-6 space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-foreground">Manage Categories</h1>
                {loading && (
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                        <Loader className="w-5 h-5 text-primary" />
                    </motion.div>
                )}
            </div>

            {/* Error Message */}
            {error && (
                <motion.div
                    className="p-4 rounded-lg bg-red-500/10 text-red-500 border border-red-500/20 flex items-center gap-3"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                >
                    <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                    <span>{error}</span>
                </motion.div>
            )}

            {/* Create/Edit Form */}
            <GlassCard className="p-6">
                <form
                    onSubmit={editingCategory ? handleEditCategory : handleCreateCategory}
                    className="flex flex-col sm:flex-row gap-3"
                >
                    <Input
                        type="text"
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        placeholder="Category Name"
                        className="flex-1"
                        required
                    />
                    <div className="flex gap-2">
                        {editingCategory ? (
                            <>
                                <Button type="submit" className="gap-2">
                                    <Check className="w-4 h-4" />
                                    Update
                                </Button>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={handleCancelEdit}
                                    className="gap-2"
                                >
                                    <X className="w-4 h-4" />
                                    Cancel
                                </Button>
                            </>
                        ) : (
                            <Button type="submit" className="gap-2">
                                <Plus className="w-4 h-4" />
                                Create Category
                            </Button>
                        )}
                    </div>
                </form>
            </GlassCard>

            {/* Category Panel */}
            <CategoryPanel
                categories={categories}
                selectedCategory={selectedCategory}
                onSelectCategory={(cat) => setSelectedCategory(cat)}
                onEditCategory={handleEditClick}
                onDeleteCategory={handleDeleteCategory}
            />

            {/* Charts */}
            <ExpensesByCategoryChart
                transactions={transactions}
                categories={categories}
                loading={loading || txLoading}
            />
        </motion.div>
    );
};

export default CategoryManager;