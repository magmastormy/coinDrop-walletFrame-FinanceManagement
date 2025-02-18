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
import './styles/createEditEducationPostStyles.css';
import EducationImageUpload from '../educationImageUpload';
import ImageService from '../../../services/imageService';
import ImageUploadPreview from '../imageUploadPreview';
import educationService from '../../../services/educationService';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_DIMENSION = 1920;

const MenuBar = ({ editor, onImageUpload }) => {
    if (!editor) return null;

    const fileInputRef = useRef(null);

    const handleImageClick = (e) => {
        e.preventDefault(); // Prevent form submission
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event) => {
        event.preventDefault(); // Prevent form submission
        const file = event.target.files?.[0];
        if (file) {
            const imageUrl = await onImageUpload(file);
            if (imageUrl) {
                editor.chain().focus().setImage({ src: imageUrl }).run();
            }
        }
        event.target.value = '';
    };

    return (
        <div className="create-edit-education-menu-bar">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                style={{ display: 'none' }}
            />
            <button
                type="button" // Explicitly set type to button
                onClick={handleImageClick}
                className={editor.isActive('image') ? 'is-active' : ''}
            >
                <FontAwesomeIcon icon={faImage} />
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={editor.isActive('bold') ? 'is-active' : ''}
            >
                <FontAwesomeIcon icon={faBold} />
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={editor.isActive('italic') ? 'is-active' : ''}
            >
                <FontAwesomeIcon icon={faItalic} />
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className={editor.isActive('heading') ? 'is-active' : ''}
            >
                <FontAwesomeIcon icon={faHeading} />
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={editor.isActive('bulletList') ? 'is-active' : ''}
            >
                <FontAwesomeIcon icon={faList} />
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                className={editor.isActive('blockquote') ? 'is-active' : ''}
            >
                <FontAwesomeIcon icon={faQuoteLeft} />
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                className={editor.isActive('codeBlock') ? 'is-active' : ''}
            >
                <FontAwesomeIcon icon={faCode} />
            </button>
            <button type="button" onClick={() => editor.chain().focus().undo().run()}>
                <FontAwesomeIcon icon={faUndo} />
            </button>
            <button type="button" onClick={() => editor.chain().focus().redo().run()}>
                <FontAwesomeIcon icon={faRedo} />
            </button>
        </div>
    );
};

const CreateEditEducationPost = ({ onSubmit, onClose, initialData }) => {
    const [title, setTitle] = useState(initialData?.title || '');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadedImages, setUploadedImages] = useState([]);

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
            const formData = new FormData();
            formData.append('image', file);
            const response = await educationService.uploadImage(file);
            const imageUrl = response.data.url;
            setUploadedImages(prev => [...prev, imageUrl]);
            return imageUrl;
        } catch (err) {
            setError('Failed to upload image');
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
        try {
            const content = editor?.getHTML() || '';
            await onSubmit({ 
                title, 
                details: content,
                category: 'general', // Default category
                images: uploadedImages 
            });
            onClose();
        } catch (err) {
            setError(err.message || 'Failed to create post');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            <div className="modal-container">
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
                >
                    <div className="create-edit-education-modal-header">
                        <h2>{initialData ? 'Edit Post' : 'Create New Post'}</h2>
                        <button 
                            type="button"
                            className="create-edit-education-close-button"
                            onClick={onClose}
                            aria-label="Close"
                        >
                            <FontAwesomeIcon icon={faTimes} />
                        </button>
                    </div>

                    {error && (
                        <div className="create-edit-education-error">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="create-edit-education-form-group">
                            <label htmlFor="title">Title</label>
                            <input
                                id="title"
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Enter your post title"
                                className="create-edit-education-title-input"
                            />
                        </div>

                        <div className="create-edit-education-editor-container">
                            <MenuBar editor={editor} onImageUpload={handleImageUpload} />
                            <EditorContent 
                                editor={editor} 
                            />
                        </div>

                        <div className="create-edit-education-actions">
                            <button
                                type="button"
                                onClick={onClose}
                                className="create-edit-education-cancel-button"
                                disabled={isSubmitting}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="create-edit-education-submit-button"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Saving...' : initialData ? 'Save Changes' : 'Create Post'}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default CreateEditEducationPost;