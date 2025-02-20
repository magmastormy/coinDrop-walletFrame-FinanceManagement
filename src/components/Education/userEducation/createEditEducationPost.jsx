import React, { useState, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faBold, faItalic, faCode, faList, 
    faImage, faHeading, faQuoteLeft, faUndo, faRedo,
    faTimes 
} from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../../../theme/ThemeContext';
import './styles/createEditEducationPostStyles.css';
import EducationImageUpload from '../educationImageUpload';
import ImageService from '../../../services/imageService';
import ImageUploadPreview from '../imageUploadPreview';
import educationService from '../../../services/educationService';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_DIMENSION = 1920;

const MenuBar = ({ editor, onImageUpload, theme }) => {
    if (!editor) return null;

    const fileInputRef = useRef(null);

    const handleImageClick = (e) => {
        e.preventDefault();
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event) => {
        event.preventDefault();
        const file = event.target.files?.[0];
        if (file) {
            try {
                if (file.size > MAX_FILE_SIZE) {
                    throw new Error('File size exceeds 5MB limit');
                }
                const imageUrl = await onImageUpload(file);
                if (imageUrl) {
                    editor.chain().focus().setImage({ src: imageUrl }).run();
                }
            } catch (error) {
                console.error('Error uploading image:', error);
                // You might want to show this error to the user
            }
        }
        event.target.value = '';
    };

    return (
        <div className="create-edit-education-menu-bar" style={{ backgroundColor: theme.backgroundAlt, color: theme.text }}>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                style={{ display: 'none' }}
            />
            <button
                type="button"
                onClick={handleImageClick}
                className={editor.isActive('image') ? 'is-active' : ''}
                style={{ color: theme.text }}
            >
                <FontAwesomeIcon icon={faImage} />
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={editor.isActive('bold') ? 'is-active' : ''}
                style={{ color: theme.text }}
            >
                <FontAwesomeIcon icon={faBold} />
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={editor.isActive('italic') ? 'is-active' : ''}
                style={{ color: theme.text }}
            >
                <FontAwesomeIcon icon={faItalic} />
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className={editor.isActive('heading') ? 'is-active' : ''}
                style={{ color: theme.text }}
            >
                <FontAwesomeIcon icon={faHeading} />
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={editor.isActive('bulletList') ? 'is-active' : ''}
                style={{ color: theme.text }}
            >
                <FontAwesomeIcon icon={faList} />
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                className={editor.isActive('blockquote') ? 'is-active' : ''}
                style={{ color: theme.text }}
            >
                <FontAwesomeIcon icon={faQuoteLeft} />
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                className={editor.isActive('codeBlock') ? 'is-active' : ''}
                style={{ color: theme.text }}
            >
                <FontAwesomeIcon icon={faCode} />
            </button>
            <button type="button" onClick={() => editor.chain().focus().undo().run()} style={{ color: theme.text }}>
                <FontAwesomeIcon icon={faUndo} />
            </button>
            <button type="button" onClick={() => editor.chain().focus().redo().run()} style={{ color: theme.text }}>
                <FontAwesomeIcon icon={faRedo} />
            </button>
        </div>
    );
};

const CreateEditEducationPost = ({ onSubmit, onClose, initialData }) => {
    const { theme } = useTheme();
    const [title, setTitle] = useState(initialData?.title || '');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadedImages, setUploadedImages] = useState([]);
    const [imageFiles, setImageFiles] = useState([]); // Store actual files

    const editor = useEditor({
        extensions: [
            StarterKit,
            Image
        ],
        content: initialData?.content || '',
        autofocus: true,
        editorProps: {
            attributes: {
                class: 'create-edit-education-editor'
            }
        }
    });

    const handleImageUpload = async (file) => {
        try {
            if (file.size > MAX_FILE_SIZE) {
                throw new Error('File size exceeds 5MB limit');
            }

            // Create a copy of the file with a unique name to prevent conflicts
            const uniqueFile = new File([file], `${Date.now()}-${file.name}`, {
                type: file.type
            });

            setImageFiles(prev => [...prev, uniqueFile]);
            
            // Instead of using blob URLs, create base64 data URLs for preview
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        } catch (err) {
            console.error('Failed to handle image:', err);
            setError('Failed to process image');
            return null;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim()) {
            setError('Title is required');
            return;
        }

        setIsSubmitting(true);
        setError('');
        
        try {
            const content = editor?.getHTML() || '';
            await onSubmit({ 
                title, 
                details: content,
                category: 'general', // Default category
                images: imageFiles // Send the actual files for upload
            });
            
            // No need to clean up data URLs since we're using FileReader
            onClose();
        } catch (err) {
            setError(err.message || 'Failed to create post');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Clean up temporary URLs when component unmounts
    React.useEffect(() => {
        return () => {
            uploadedImages.forEach(url => URL.revokeObjectURL(url));
        };
    }, []);

    return (
        <AnimatePresence>
            <div className="modal-container" style={{ backgroundColor: theme.background }}>
                <motion.div 
                    className="create-edit-education-modal-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                />
                <motion.div 
                    className="create-edit-education-modal"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={e => e.stopPropagation()}
                    style={{ backgroundColor: theme.backgroundAlt, color: theme.text }}
                >
                    <div className="create-edit-education-modal-header" style={{ borderBottom: `1px solid ${theme.border}` }}>
                        <h2 style={{ color: theme.text }}>{initialData ? 'Edit Post' : 'Create New Post'}</h2>
                        <button 
                            type="button"
                            className="create-edit-education-close-button"
                            onClick={onClose}
                            aria-label="Close"
                            style={{ color: theme.text }}
                        >
                            <FontAwesomeIcon icon={faTimes} />
                        </button>
                    </div>

                    {error && (
                        <div className="create-edit-education-error" style={{ color: theme.text }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="create-edit-education-form" style={{ color: theme.text }}>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Enter post title..."
                            className="create-edit-education-title"
                            style={{
                                backgroundColor: theme.backgroundAlt,
                                color: theme.text,
                                border: `1px solid ${theme.border}`
                            }}
                        />
                        
                        <div className="create-edit-education-editor-container" style={{ 
                            backgroundColor: theme.backgroundAlt,
                            border: `1px solid ${theme.border}`
                        }}>
                            <MenuBar editor={editor} onImageUpload={handleImageUpload} theme={theme} />
                            <EditorContent editor={editor} />
                        </div>

                        <div className="create-edit-education-actions">
                            <button
                                type="button"
                                onClick={onClose}
                                className="create-edit-education-cancel"
                                disabled={isSubmitting}
                                style={{
                                    backgroundColor: theme.primary,
                                    color: theme.buttonText
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="create-edit-education-submit"
                                disabled={isSubmitting}
                                style={{
                                    backgroundColor: theme.primary,
                                    color: theme.buttonText
                                }}
                            >
                                {isSubmitting ? 'Saving...' : (initialData ? 'Update' : 'Create')}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default CreateEditEducationPost;