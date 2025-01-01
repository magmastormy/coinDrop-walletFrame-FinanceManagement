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

const MenuBar = ({ editor }) => {
    const imageInputRef = useRef(null);

    if (!editor) return null;

    const addImage = async (e) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                const reader = new FileReader();
                reader.onload = () => {
                    editor.chain().focus().setImage({ src: reader.result }).run();
                };
                reader.readAsDataURL(file);
            } catch (error) {
                console.error('Image upload failed:', error);
            }
        }
    };

    return (
        <div className="editor-menu">
            <button onClick={() => editor.chain().focus().toggleBold().run()}>
                <FontAwesomeIcon icon={faBold} />
            </button>
            <button onClick={() => editor.chain().focus().toggleItalic().run()}>
                <FontAwesomeIcon icon={faItalic} />
            </button>
            <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
                <FontAwesomeIcon icon={faHeading} />
            </button>
            <button onClick={() => editor.chain().focus().toggleBulletList().run()}>
                <FontAwesomeIcon icon={faList} />
            </button>
            <button onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
                <FontAwesomeIcon icon={faCode} />
            </button>
            <button onClick={() => editor.chain().focus().toggleBlockquote().run()}>
                <FontAwesomeIcon icon={faQuoteLeft} />
            </button>
            <button onClick={() => imageInputRef.current?.click()}>
                <FontAwesomeIcon icon={faImage} />
            </button>
            <button onClick={() => editor.chain().focus().undo().run()}>
                <FontAwesomeIcon icon={faUndo} />
            </button>
            <button onClick={() => editor.chain().focus().redo().run()}>
                <FontAwesomeIcon icon={faRedo} />
            </button>
            <input
                type="file"
                ref={imageInputRef}
                onChange={addImage}
                accept="image/*"
                style={{ display: 'none' }}
            />
        </div>
    );
};

const CreateEditEducationPost = ({ onCreateEducation, onClose, initialData }) => {
    const [title, setTitle] = useState(initialData?.title || '');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isPreview, setIsPreview] = useState(false);

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
        <div className="modal-overlay" onClick={handleOverlayClick}>
            <div className="education-editor">
                <div className="modal-header">
                    <h2>{initialData ? 'Edit Post' : 'Create New Post'}</h2>
                    <button 
                        type="button" 
                        className="close-button"
                        onClick={onClose}
                        aria-label="Close"
                    >
                        ×
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    {error && <div className="error-message">{error}</div>}
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Enter title"
                        className="title-input"
                    />
                    <div className="editor-container">
                        <MenuBar editor={editor} />
                        <EditorContent editor={editor} />
                    </div>
                    <div className="form-actions">
                        <button 
                            type="button" 
                            className="cancel-btn"
                            onClick={onClose}
                        >
                            Cancel
                        </button>
                        <button 
                            type="button" 
                            onClick={() => setIsPreview(!isPreview)}
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
                    <div className="preview-mode">
                        <h2>{title}</h2>
                        <div dangerouslySetInnerHTML={{ __html: editor?.getHTML() }} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default CreateEditEducationPost;