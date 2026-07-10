import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { Plus, Check, X, AlertTriangle, Loader } from 'lucide-react';
import { setCategories, setLoading, setError } from '../../slices/categorySlice';
import categoryService from '../../services/categoryService';
import transactionService from '../../services/transactionService';
import ValidationUtils from '../../utils/validationUtils';
import CategoryPanel from './categoryPanel';
import ExpensesByCategoryChart from './expensesbycategoryChart';
import Button from '../ui/Button';
import { Input } from '../ui/Input';
import Card from '../ui/Card';
import PageHeader from '../Common/PageHeader';

const CategoryManager = () => {
    const dispatch = useDispatch();
    const { categories, loading, error } = useSelector(state => state.category);
    const { user } = useSelector(state => state.auth);
    const [newCategory, setNewCategory] = useState('');
    const [editingCategory, setEditingCategory] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
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
        
        // Validate category name
        const nameValidation = ValidationUtils.validateRequiredString(newCategory, 'Category name', 1, 50);
        if (!nameValidation.isValid) {
            dispatch(setError(nameValidation.error));
            return;
        }

        try {
            const categoryData = { name: newCategory.trim() };
            await ValidationUtils.withTimeout(
                ValidationUtils.withRetry(
                    () => categoryService.createCategory(categoryData),
                    'createCategory',
                    3,
                    1000
                ),
                30000
            );
            fetchCategories();
            setNewCategory('');
        } catch (err) {
            dispatch(setError(err.message));
        }
    };

    const handleEditCategory = async (e) => {
        e.preventDefault();
        
        // Validate category name
        const nameValidation = ValidationUtils.validateRequiredString(newCategory, 'Category name', 1, 50);
        if (!nameValidation.isValid) {
            dispatch(setError(nameValidation.error));
            return;
        }

        try {
            const categoryData = { name: newCategory.trim() };
            await ValidationUtils.withTimeout(
                ValidationUtils.withRetry(
                    () => categoryService.updateCategory(editingCategory._id, categoryData),
                    'updateCategory',
                    3,
                    1000
                ),
                30000
            );
            fetchCategories();
            setNewCategory('');
            setEditingCategory(null);
        } catch (err) {
            dispatch(setError(err.message));
        }
    };

    const handleDeleteCategory = async (categoryId) => {
        if (deleteConfirm === categoryId) {
            try {
                await categoryService.deleteCategory(categoryId);
                fetchCategories();
                setDeleteConfirm(null);
            } catch (err) {
                dispatch(setError(err.message));
            }
        } else {
            setDeleteConfirm(categoryId);
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
            setTransactions(res.transactions || []);
        } catch (err) {
            setTxError(err.message);
        } finally {
            setTxLoading(false);
        }
    };

    return (
        <motion.div
            className="p-6 md:p-8 space-y-6 md:space-y-8"
            style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <PageHeader
                title="Categories"
                compact={true}
                actions={loading ? (
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                        <Loader className="w-4 h-4" strokeWidth={1.5} style={{ color: 'var(--color-text-secondary)' }} />
                    </motion.div>
                ) : null}
            />

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

            {/* Delete Confirmation */}
            {deleteConfirm && (
                <motion.div
                    className="p-4 rounded-lg bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 flex items-center justify-between gap-3"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                >
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                        <span>Are you sure you want to delete this category?</span>
                    </div>
                    <div className="flex gap-2">
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setDeleteConfirm(null)}
                        >
                            Cancel
                        </Button>
                        <Button 
                            variant="default" 
                            size="sm" 
                            onClick={() => handleDeleteCategory(deleteConfirm)}
                        >
                            Confirm
                        </Button>
                    </div>
                </motion.div>
            )}

            {/* Create/Edit Form */}
            <Card variant="default" elevation={1} className="p-6">
                <form
                    onSubmit={editingCategory ? handleEditCategory : handleCreateCategory}
                    className="flex flex-col sm:flex-row gap-3"
                >
                    <Input
                        type="text"
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        placeholder="Category Name"
                        className="h-10 flex-1"
                        required
                    />
                    <div className="flex gap-2">
                        {editingCategory ? (
                            <>
                                <Button type="submit" size="sm" className="h-10 gap-2">
                                    <Check className="w-4 h-4" />
                                    Update
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={handleCancelEdit}
                                    size="sm"
                                    className="h-10 gap-2"
                                >
                                    <X className="w-4 h-4" />
                                    Cancel
                                </Button>
                            </>
                        ) : (
                            <Button type="submit" size="sm" className="h-10 gap-2">
                                <Plus className="w-4 h-4" />
                                Create Category
                            </Button>
                        )}
                    </div>
                </form>
            </Card>

            {/* Category Panel */}
            <CategoryPanel
                categories={categories}
                selectedCategory={selectedCategory}
                onSelectCategory={(cat) => setSelectedCategory(cat)}
                onEditCategory={handleEditClick}
                onDeleteCategory={handleDeleteCategory}
            />

            {/* Charts */}
            <div style={{ flex: 1, overflow: 'auto' }}>
                <ExpensesByCategoryChart
                    transactions={transactions}
                    categories={categories}
                    loading={loading || txLoading}
                />
            </div>
        </motion.div>
    );
};

export default CategoryManager;
