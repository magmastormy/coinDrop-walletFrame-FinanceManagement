const Category = require('../models/Category');

class CategoryController {
    // Create a new category
    static async createCategory(req, res) {
        try {
            const categoryData = {
                ...req.body,
                userId: req.user._id // Associate the category with the user
            };
            const category = new Category(categoryData);
            await category.save();

            res.status(201).json({
                message: 'Category created successfully',
                category
            });
        } catch (error) {
            res.status(400).json({
                error: 'Category creation failed',
                details: error.message
            });
        }
    }

    // Get all categories for a user
    static async getAllCategories(req, res) {
        try {
            const categories = await Category.find({ userId: req.user._id }); // Filter by userId
            res.json(categories);
        } catch (error) {
            res.status(500).json({
                error: 'Failed to retrieve categories',
                details: error.message
            });
        }
    }

    // Update a category
    static async updateCategory(req, res) {
        const { id } = req.params;

        try {
            const category = await Category.findOneAndUpdate(
                { 
                    _id: id, 
                    userId: req.user._id // Ensure the category belongs to the user
                },
                req.body,
                { 
                    new: true, 
                    runValidators: true 
                }
            );

            if (!category) {
                return res.status(404).json({ 
                    error: 'Category not found or unauthorized' 
                });
            }

            res.json({
                message: 'Category updated successfully',
                category
            });
        } catch (error) {
            res.status(400).json({
                error: 'Category update failed',
                details: error.message
            });
        }
    }

    // Delete a category
    static async deleteCategory(req, res) {
        const { id } = req.params;

        try {
            const category = await Category.findOneAndDelete({
                _id: id,
                userId: req.user._id // Ensure the category belongs to the user
            });

            if (!category) {
                return res.status(404).json({ 
                    error: 'Category not found or unauthorized' 
                });
            }

            res.json({
                message: 'Category deleted successfully',
                category
            });
        } catch (error) {
            res.status(500).json({
                error: 'Category deletion failed',
                details: error.message
            });
        }
    }
}

module.exports = CategoryController;