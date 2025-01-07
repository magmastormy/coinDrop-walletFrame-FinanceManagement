import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faPlus,
    faEdit,
    faTrash,
    faCheck,
    faTimes,
    faExclamationTriangle,
    faSpinner
} from '@fortawesome/free-solid-svg-icons';
import { setCategories, setLoading, setError } from '../../slices/categorySlice';
import categoryService from '../../services/categoryService';
import './styles/categoryManagerStyles.css';

const CategoryManager = () => {
    const dispatch = useDispatch();
    const { categories, loading, error } = useSelector(state => state.category);
    const { user } = useSelector(state => state.auth);
    const [newCategory, setNewCategory] = useState('');
    const [editingCategory, setEditingCategory] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    useEffect(() => {
        fetchCategories();
    }, [dispatch]);

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

    return (
        <motion.div 
            className="category-manager"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <div className="manager-header">
                <h2>Manage Categories</h2>
                {loading && (
                    <motion.div
                        className="loading-spinner"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                        <FontAwesomeIcon icon={faSpinner} />
                    </motion.div>
                )}
            </div>

            {error && (
                <motion.div 
                    className="error-message"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                >
                    <FontAwesomeIcon icon={faExclamationTriangle} />
                    <span>{error}</span>
                </motion.div>
            )}

            <form 
                className="category-form"
                onSubmit={editingCategory ? handleEditCategory : handleCreateCategory}
            >
                <div className="input-group">
                    <input
                        type="text"
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        placeholder="Category Name"
                        aria-label="Category name"
                        required
                    />
                    <div className="form-buttons">
                        {editingCategory ? (
                            <>
                                <button 
                                    type="submit"
                                    className="btn-primary"
                                    aria-label="Update category"
                                >
                                    <FontAwesomeIcon icon={faCheck} />
                                    Update
                                </button>
                                <button 
                                    type="button"
                                    className="btn-secondary"
                                    onClick={handleCancelEdit}
                                    aria-label="Cancel editing"
                                >
                                    <FontAwesomeIcon icon={faTimes} />
                                    Cancel
                                </button>
                            </>
                        ) : (
                            <button 
                                type="submit"
                                className="btn-primary"
                                aria-label="Create new category"
                            >
                                <FontAwesomeIcon icon={faPlus} />
                                Create Category
                            </button>
                        )}
                    </div>
                </div>
            </form>

            <motion.div 
                className="category-list-container"
                layout
            >
                <AnimatePresence>
                    {categories.map(category => (
                        <motion.div
                            key={category._id}
                            className="category-item"
                            layout
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.2 }}
                        >
                            <span className="category-name">
                                {category.name}
                                {category.name === "None" && (
                                    <span className="default-badge" title="Default category - cannot be deleted">
                                        Default
                                    </span>
                                )}
                            </span>
                            <div className="category-actions">
                                {deleteConfirm === category._id ? (
                                    <div className="delete-confirm">
                                        <span>Delete?</span>
                                        <button 
                                            onClick={() => handleDeleteCategory(category._id)}
                                            className="btn-danger"
                                            aria-label="Confirm delete category"
                                            disabled={category.name === "None"}
                                        >
                                            <FontAwesomeIcon icon={faCheck} />
                                        </button>
                                        <button 
                                            onClick={() => setDeleteConfirm(null)}
                                            className="btn-secondary"
                                            aria-label="Cancel delete"
                                        >
                                            <FontAwesomeIcon icon={faTimes} />
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <button 
                                            onClick={() => handleEditClick(category)}
                                            className="btn-edit"
                                            aria-label="Edit category"
                                        >
                                            <FontAwesomeIcon icon={faEdit} />
                                        </button>
                                        <button 
                                            onClick={() => setDeleteConfirm(category._id)}
                                            className="btn-delete"
                                            aria-label="Delete category"
                                            disabled={category.name === "None"}
                                            title={category.name === "None" ? "Cannot delete default category" : "Delete category"}
                                        >
                                            <FontAwesomeIcon icon={faTrash} />
                                        </button>
                                    </>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
                
                {categories.length === 0 && !loading && (
                    <motion.div 
                        className="empty-state"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                        <p>No categories yet. Create one to get started!</p>
                    </motion.div>
                )}
            </motion.div>
        </motion.div>
    );
};

export default CategoryManager;