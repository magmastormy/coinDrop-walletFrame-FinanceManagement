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
import EducationImageUpload from '../educationImageUpload';
import ImageService from '../../../services/imageService';
import ImageUploadPreview from '../imageUploadPreview';
import educationService from '../../../services/educationService';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_DIMENSION = 1920;

const MenuBar = ({ editor, onImageUpload }) => {
    if (!editor) return null;

    const fileInputRef = useRef(null);

    const handleImageClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event) => {
        const file = event.target.files?.[0];
        if (file) {
            const imageUrl = await onImageUpload(file);
            if (imageUrl) {
                editor.chain().focus().setImage({ src: imageUrl }).run();
            }
        }
        // Reset input value to allow selecting the same file again
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
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={`create-edit-education-menu-button ${editor.isActive('bold') ? 'is-active' : ''}`}
                title="Bold"
            >
                <FontAwesomeIcon icon={faBold} />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={`create-edit-education-menu-button ${editor.isActive('italic') ? 'is-active' : ''}`}
                title="Italic"
            >
                <FontAwesomeIcon icon={faItalic} />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className={`create-edit-education-menu-button ${editor.isActive('heading') ? 'is-active' : ''}`}
                title="Heading"
            >
                <FontAwesomeIcon icon={faHeading} />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={`create-edit-education-menu-button ${editor.isActive('bulletList') ? 'is-active' : ''}`}
                title="Bullet List"
            >
                <FontAwesomeIcon icon={faList} />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                className={`create-edit-education-menu-button ${editor.isActive('codeBlock') ? 'is-active' : ''}`}
                title="Code Block"
            >
                <FontAwesomeIcon icon={faCode} />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                className={`create-edit-education-menu-button ${editor.isActive('blockquote') ? 'is-active' : ''}`}
                title="Quote"
            >
                <FontAwesomeIcon icon={faQuoteLeft} />
            </button>
            <button
                onClick={handleImageClick}
                className="create-edit-education-menu-button"
                title="Insert Image"
            >
                <FontAwesomeIcon icon={faImage} />
            </button>
            <button
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!editor.can().undo()}
                className="create-edit-education-menu-button"
                title="Undo"
            >
                <FontAwesomeIcon icon={faUndo} />
            </button>
            <button
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!editor.can().redo()}
                className="create-edit-education-menu-button"
                title="Redo"
            >
                <FontAwesomeIcon icon={faRedo} />
            </button>
        </div>
    );
};

const CreateEditEducationPost = ({ onCreateEducation, onClose, initialData }) => {
    const [title, setTitle] = useState(initialData?.title || '');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isPreview, setIsPreview] = useState(false);
    const [images, setImages] = useState(initialData?.images || []);
    const [featuredImage, setFeaturedImage] = useState(initialData?.featuredImage || null);

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
        try {
            setIsUploadingImage(true);
            const uploadedImage = await ImageService.uploadImage(file, 'education');
            
            if (!featuredImage) {
                setFeaturedImage(uploadedImage);
            } else {
                setImages(prev => [...prev, uploadedImage]);
            }
            
            return uploadedImage.url;
        } catch (error) {
            console.error('Image upload failed:', error);
            setError('Failed to upload image');
            return null;
        } finally {
            setIsUploadingImage(false);
        }
    };

    const handleImageRemove = async (imageId) => {
        try {
            await ImageService.deleteImage(imageId);
            if (featuredImage?._id === imageId) {
                setFeaturedImage(null);
            } else {
                setImages(prev => prev.filter(img => img._id !== imageId));
            }
        } catch (error) {
            setError('Failed to remove image');
        }
    };

    const validateForm = () => {
        if (!title.trim()) {
            setError('Title is required');
            return false;
        }
        if (!editor?.getHTML() || editor.getHTML() === '<p></p>') {
            setError('Content is required');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        try {
            setIsLoading(true);
            const content = editor.getHTML();
            
            await onCreateEducation({
                title: title.trim(),
                details: content,
                images: images.map(img => img._id),
                featuredImage: featuredImage?._id,
                date: new Date().toISOString()
            });
            
            onClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            editor?.commands.focus();
        }
    };

    return (
        <div className="create-edit-education-modal">
            <div className="create-edit-education-content">
                <button
                    className="create-edit-education-close-button"
                    onClick={onClose}
                    aria-label="Close"
                >
                    ×
                </button>
                <form onSubmit={handleSubmit}>
                    {error && <div className="create-edit-education-error-message">{error}</div>}
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Enter title"
                        className="create-edit-education-title-input"
                        onKeyDown={handleKeyDown}
                    />
                    
                    <EducationImageUpload
                        onImageUpload={handleImageUpload}
                        onImageRemove={handleImageRemove}
                        currentImages={[...featuredImage ? [featuredImage] : [], ...images]}
                        maxImages={5}
                        className="education-image-upload"
                    />

                    <div className="create-edit-education-editor-container">
                        <MenuBar
                            editor={editor}
                            onImageUpload={handleImageUpload}
                        />
                        <EditorContent 
                            editor={editor} 
                            className="create-edit-education-editor"
                        />
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
                            className="create-edit-education-preview-btn"
                            onClick={() => setIsPreview(!isPreview)}
                        >
                            {isPreview ? 'Edit' : 'Preview'}
                        </button>
                        <button 
                            type="submit" 
                            className="create-edit-education-submit-btn"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Creating...' : initialData ? 'Update' : 'Create Post'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateEditEducationPost;