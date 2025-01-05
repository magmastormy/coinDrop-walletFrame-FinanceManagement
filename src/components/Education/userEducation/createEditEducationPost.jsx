// src/components/Education/userEducation/createEditEducationPost.jsx
import React, { useState, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faBold, faItalic, faCode, faList, 
    faImage, faHeading, faQuoteLeft, faUndo, faRedo 
} from '@fortawesome/free-solid-svg-icons';
import './styles/createEditEducationPostStyles.css';
import imageCompression from 'browser-image-compression';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5mb
const MAX_DIMENSION = 1920;

const MenuBar = ({ editor, onImageUpload }) => {
    const [isUploadingImage, setIsUploadingImage] = useState(false);

    const handleImageUpload = async (file) => {
        if (!file) return;
        setIsUploadingImage(true);
    
        try {
            const compressedFile = await imageCompression(file, {
                maxSizeMB: 1,
                maxWidthOrHeight: MAX_DIMENSION,
                useWebWorker: true
            });
            
            const reader = new FileReader();
            reader.onload = () => {
                if (editor) {
                    editor.chain().focus().setImage({ src: reader.result }).run();
                }
            };
            reader.readAsDataURL(compressedFile);
        } catch (error) {
            console.error('Image upload failed:', error);
            setError('Image upload failed: ' + error.message);
        } finally {
            setIsUploadingImage(false);
        }
    };

    const handleImageClick = (e) => {
        e.preventDefault(); 
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => onImageUpload(e.target.files[0]);
        input.click();
    };

    return (
        <div className="create-edit-education-menu-bar">
            <button className="create-edit-education-menu-button" onClick={() => editor.chain().focus().toggleBold().run()}>
                <FontAwesomeIcon icon={faBold} />
            </button>
            <button className="create-edit-education-menu-button" onClick={() => editor.chain().focus().toggleItalic().run()}>
                <FontAwesomeIcon icon={faItalic} />
            </button>
            <button className="create-edit-education-menu-button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
                <FontAwesomeIcon icon={faHeading} />
            </button>
            <button className="create-edit-education-menu-button" onClick={() => editor.chain().focus().toggleBulletList().run()}>
                <FontAwesomeIcon icon={faList} />
            </button>
            <button className="create-edit-education-menu-button" onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
                <FontAwesomeIcon icon={faCode} />
            </button>
            <button className="create-edit-education-menu-button" onClick={() => editor.chain().focus().toggleBlockquote().run()}>
                <FontAwesomeIcon icon={faQuoteLeft} />
            </button>
            <button className="create-edit-education-menu-button" onClick={() => editor.chain().focus().undo().run()}>
                <FontAwesomeIcon icon={faUndo} />
            </button>
            <button className="create-edit-education-menu-button" onClick={() => editor.chain().focus().redo().run()}>
                <FontAwesomeIcon icon={faRedo} />
            </button>
            <button className="create-edit-education-menu-button" onClick={handleImageClick} disabled={isUploadingImage}>
                <FontAwesomeIcon icon={faImage} /> {isUploadingImage && <span className="loading-indicator">...</span>}
            </button> 
        </div>
    );
};

const CreateEditEducationPost = ({ onCreateEducation, onClose, initialData }) => {
    const [title, setTitle] = useState(initialData?.title || '');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isPreview, setIsPreview] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false);

    const editor = useEditor({
        extensions: [
            StarterKit,
            Image.configure({
                HTMLAttributes: {
                    class: 'education-post-image',
                    loading: 'lazy',
                }
            })
        ],
        content: initialData?.details || '',
        autofocus: true,
    });

    const handleImageUpload = async (file) => {
        if (!file) return;
        setIsUploadingImage(true);

        try {
            if (!file.type.startsWith('image/')) {
                throw new Error('Please select an image file');
            }

            if (file.size > MAX_FILE_SIZE) {
                const options = {
                    maxSizeMB: 5,
                    maxWidthOrHeight: MAX_DIMENSION,
                    useWebWorker: true,
                };
                file = await imageCompression(file, options);
            }

            const reader = new FileReader();
            reader.onload = () => {
                if (editor) {
                    editor
                        .chain()
                        .focus()
                        .setImage({ src: reader.result })
                        .run();
                }
            };
            reader.readAsDataURL(file);

        } catch (error) {
            console.error('Image upload failed:', error);
            alert(error.message || 'Failed to upload image');
        } finally {
            setIsUploadingImage(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        if (!validateForm()) return;

        try {
            setIsLoading(true);
            const content = editor.getHTML();
            
            await onCreateEducation({
                title: title.trim(),
                details: content,
                date: new Date().toISOString()
            });
            
            setTitle('');
            editor?.commands.setContent('');
            onClose();
            
        } catch (err) {
            setError(err.message || 'Failed to create post');
        } finally {
            setIsLoading(false);
        }
    };

    const validateForm = () => {
        if (!title || title.trim().length < 5) {
            setError('Title must be at least 5 characters long');
            return false;
        }

        if (!editor || !editor.getText().trim() || editor.getText().trim().length < 10) {
            setError('Content must be at least 10 characters long');
            return false;
        }

        setError('');
        return true;
    };

    const handleOverlayClick = (e) => {
        if (e.target.className === 'modal-overlay') {
            onClose();
        }
    };

    return (
        <div className="create-edit-education-modal-overlay" onClick={handleOverlayClick}>
            <div className="create-edit-education-modal">
                <div className="create-edit-education-modal-header">
                    <h2 className="create-edit-education-modal-title">{initialData ? 'Edit Post' : 'Create New Post'}</h2>
                    <button
                        type="button" 
                        className="create-edit-education-close-button"
                        onClick={onClose}
                        aria-label="Close"
                    >
                        ×
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    {error && <div className="create-edit-education-error-message">{error}</div>}
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Enter title"
                        className="create-edit-education-title-input"
                    />
                    <div className="create-edit-education-editor-container">
                        <MenuBar
                            editor={editor}
                            isUploadingImage={isUploadingImage}
                            onImageUpload={handleImageUpload} />
                        <EditorContent 
                            editor={editor} 
                            className="create-edit-education-editor"/>
                    </div>
                    <div className="create-edit-education-form-actions">
                        <button
                            type="button" 
                            className="create-edit-education-cancel-btn"
                            onClick={onClose}
                        >
                            Cancel
                        </button>
                        <button
                            type="button" 
                            className="create-edit-education-preview-btn" onClick={() => setIsPreview(!isPreview)}
                        >
                            {isPreview ? 'Edit' : 'Preview'}
                        </button>
                        <button 
                            type="submit" 
                            className="submit-btn"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Creating...' : initialData ? 'Update' : 'Create Post'}
                        </button>
                    </div>
                </form>
                {isPreview && (
                    <div className="create-edit-education-preview-mode">
                        <h2 className="create-edit-education-preview-title">{title}</h2>
                        <div dangerouslySetInnerHTML={{ __html: editor?.getHTML() }} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default CreateEditEducationPost;