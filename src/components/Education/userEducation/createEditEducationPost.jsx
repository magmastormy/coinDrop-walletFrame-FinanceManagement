import React, { useState, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
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
import { toast } from 'react-toastify';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_DIMENSION = 1920;

const MenuBar = ({ editor, theme, setImageFiles, setUploadedImages }) => {
    if (!editor) return null;

    const fileInputRef = useRef(null);

    const handleImageClick = (e) => {
        e.preventDefault();
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event) => {
        event.preventDefault();
        const file = event.target.files?.[0];
        if (!file) return;
        
        try {
            if (file.size > MAX_FILE_SIZE) {
                toast.error('File size exceeds 5MB limit');
                return;
            }
            
            // Create preview URL only - don't upload yet
            const previewUrl = URL.createObjectURL(file);
            
            // Add to the image files collection for later upload
            setImageFiles(prev => [...prev, file]);
            
            // Generate a temporary ID for this image
            const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
            
            // Add to preview state with the file for later upload
            setUploadedImages(prev => [...prev, {
                tempId: tempId,
                preview: previewUrl,
                file: file,
                isUploaded: false,
                pendingUpload: true
            }]);
            
            // Insert image directly into the editor with the preview URL
            editor.chain()
                .focus()
                .setImage({ 
                    src: previewUrl,
                    alt: file.name.split('.')[0],
                    'data-temp-id': tempId // Add a data attribute to find this image later
                })
                .run();
            
            toast.info('Image added to post. Save to upload.', {
                autoClose: 2000
            });
            
        } catch (error) {
            console.error('Error preparing image:', error);
            toast.error(`Error: ${error.message || 'Failed to prepare image'}`);
        }
        
        // Reset the input
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
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={`editor-button ${editor.isActive('bold') ? 'is-active' : ''}`}
                style={{ color: editor.isActive('bold') ? theme.accent : theme.text }}
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
            <button
                type="button"
                onClick={handleImageClick}
                className="editor-button image-button"
                style={{ color: theme.text }}
            >
                <FontAwesomeIcon icon={faImage} />
            </button>
        </div>
    );
};

const CreateEditEducationPost = ({ onSubmit, onClose, post = null }) => {
    const { theme } = useTheme();
    const [title, setTitle] = useState('');
    const [imageFiles, setImageFiles] = useState([]);
    const [uploadedImages, setUploadedImages] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const isEditMode = !!post;

    const editor = useEditor({
        extensions: [
            StarterKit,
            Image.configure({
                inline: false,
                allowBase64: true,
                HTMLAttributes: {
                    class: 'image-resizable',
                },
            }),
            Link.configure({
                openOnClick: false,
            }),
        ],
        content: '',
        editorProps: {
            attributes: {
                class: 'education-editor-content',
            },
        }
    });

    useEffect(() => {
        if (post && editor) {
            console.log("Loading post for editing:", post);
            setTitle(post.title || '');
            
            // Process content to replace placeholder images with actual image URLs
            let contentToSet = post.details || '';
            
            // Check if we have actual images to use
            if (post.images && post.images.length > 0) {
                console.log("Post has images:", post.images);
                
                // Create an array to track loaded images
                const loadedImages = [];
                
                // For each image in the post, create a reference
                post.images.forEach((img, index) => {
                    if (img && (img.url || typeof img === 'string')) {
                        const imageUrl = img.url || img;
                        console.log(`Processing image ${index + 1}:`, imageUrl);
                        
                        // Replace [IMAGE] placeholders with actual URLs
                        contentToSet = contentToSet.replace('[IMAGE]', imageUrl);
                        
                        // Create a reference to the existing image
                        loadedImages.push({
                            preview: imageUrl,
                            isExisting: true,
                            url: imageUrl
                        });
                    }
                });
                
                console.log("Loaded images:", loadedImages);
                console.log("Updated content:", contentToSet);
                
                // Set the uploaded images state
                setUploadedImages(loadedImages);
            }
            
            // Set the editor content with processed content
            editor.commands.setContent(contentToSet);
            
            // For debugging, check what was actually set
            console.log("Editor content after setting:", editor.getHTML());
        }
    }, [post, editor]);

    const handleImageUpload = async (file) => {
        try {
            if (file.size > MAX_FILE_SIZE) {
                toast.error('File size exceeds 5MB limit');
                return null;
            }
            
            const response = await ImageService.uploadImage(file, 'education');
            console.log("Image uploaded:", response);
            
            if (response && response.url) {
                setImageFiles(prev => [...prev, file]);
                
                setUploadedImages(prev => [...prev, {
                    preview: URL.createObjectURL(file),
                    file
                }]);
                
                return response.url;
            }
            return null;
        } catch (error) {
            console.error('Error uploading image:', error);
            toast.error('Failed to upload image');
            return null;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!title.trim()) {
            setError('Title is required');
            return;
        }
        
        if (!editor.getText().trim()) {
            setError('Content is required');
            return;
        }
        
        setIsSubmitting(true);
        setError('');
        
        try {
            const content = editor.getHTML();
            
            // Find pending images that need to be uploaded
            const pendingImages = uploadedImages.filter(img => img.pendingUpload);
            console.log("Pending images to upload:", pendingImages.length);
            
            // Create the post data object
            const postData = {
                title: title.trim(),
                details: content,
                // Separate pending images and existing image IDs
                pendingImages: pendingImages,
                existingImageIds: uploadedImages
                    .filter(img => img.imageId && !img.pendingUpload)
                    .map(img => img.imageId)
            };
            
            if (isEditMode) {
                postData._id = post._id;
            }
            
            console.log('Submitting education post data:', postData);
            
            // Show uploading toast when we have pending images
            if (pendingImages.length > 0) {
                toast.info(`Uploading ${pendingImages.length} image(s)...`, {
                    autoClose: false,
                    toastId: 'uploading-images'
                });
            }
            
            // Send to server via onSubmit callback
            const response = await onSubmit(postData);
            
            if (pendingImages.length > 0) {
                toast.update('uploading-images', {
                    render: 'Images uploaded successfully',
                    type: toast.TYPE.SUCCESS,
                    autoClose: 2000
                });
            }
            
            if (!response) {
                throw new Error('Failed to save post');
            }
            
            // Clean up any object URLs created for previews
            uploadedImages.forEach(img => {
                if (img.preview && typeof img.preview === 'string') {
                    URL.revokeObjectURL(img.preview);
                }
            });
            
            toast.success(isEditMode ? 'Post updated successfully' : 'Post created successfully');
            onClose();
        } catch (err) {
            console.error('Error saving education post:', err);
            setError('Error saving post: ' + (err.message || 'Unknown error'));
            toast.error('Error saving post');
        } finally {
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        return () => {
            uploadedImages.forEach(img => {
                if (img.preview && !img.isExisting) {
                    URL.revokeObjectURL(img.preview);
                }
            });
        };
    }, [uploadedImages]);

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
                        <h2 style={{ color: theme.text }}>{isEditMode ? 'Edit Post' : 'Create New Post'}</h2>
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
                        
                        {uploadedImages.length > 0 && (
                            <div className="image-preview-container" style={{ marginBottom: '1rem' }}>
                                <h4 style={{ color: theme.text }}>Uploaded Images:</h4>
                                <div className="image-previews">
                                    {uploadedImages.map((image, index) => (
                                        <div className="image-preview" key={index}>
                                            <img 
                                                src={image.preview || image.url} 
                                                alt={`Preview ${index}`}
                                                style={{ 
                                                    maxWidth: '100px', 
                                                    maxHeight: '100px',
                                                    border: `1px solid ${theme.border}`
                                                }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setUploadedImages(prev => prev.filter((_, i) => i !== index));
                                                    if (!image.isExisting) {
                                                        setImageFiles(prev => prev.filter((_, i) => i !== index));
                                                        URL.revokeObjectURL(image.preview);
                                                    }
                                                }}
                                                style={{ 
                                                    backgroundColor: theme.error,
                                                    color: 'white' 
                                                }}
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        <div className="editor-container">
                            <MenuBar 
                                editor={editor} 
                                theme={theme} 
                                setImageFiles={setImageFiles}
                                setUploadedImages={setUploadedImages}
                            />
                            <EditorContent 
                                editor={editor} 
                                className="education-editor" 
                                style={{ 
                                    backgroundColor: theme.background.secondary,
                                    color: theme.text.primary
                                }}
                            />
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
                                {isSubmitting ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Create Post')}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default CreateEditEducationPost;