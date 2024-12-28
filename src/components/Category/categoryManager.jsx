import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector} from 'react-redux';
import { setCategories, setLoading, setError } from '../../slices/categorySlice';
import categoryService from '../../services/categoryService';
import './styles/categoryManagerStyles.css';

const CategoryManager = () => {
    const dispatch = useDispatch();
    const { categories, loading, error } = useSelector(state => state.category);
    const { user } = useSelector(state => state.auth);
    const [newCategory, setNewCategory] = useState('');
    const [editingCategory, setEditingCategory] = useState(null);

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

    const handleCreateCategory = async () => {
        try {
            const categoryData = { name: newCategory };
            await categoryService.createCategory(categoryData);
            fetchCategories();
            setNewCategory('');
        } catch (err) {
            dispatch(setError(err.message));
        }
    };

    const handleEditCategory = async () => {
        try {
            const categoryData = { name: newCategory };
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
        } catch (err) {
            dispatch(setError(err.message));
        }
    };

    const handleEditClick = (category) => {
        setNewCategory(category.name);
        setEditingCategory(category);
    };

    return (
        <div className="category-manager">
            <h2>Manage Categories</h2>
            {loading && <p>Loading categories...</p>}
            {error && <p className="error-message">{error}</p>}
            <div className="category-form">
                <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="Category Name"
                />
                {editingCategory ? (
                    <button onClick={handleEditCategory}>Update Category</button>
                ) : (
                    <button onClick={handleCreateCategory}>Create Category</button>
                )}
            </div>
            <ul className="category-list">
                {categories.map(category => (
                    <li key={category._id}>
                        {category.name}
                        <button onClick={() => handleEditClick(category)}>Edit</button>
                        <button onClick={() => handleDeleteCategory(category._id)}>Delete</button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default CategoryManager;