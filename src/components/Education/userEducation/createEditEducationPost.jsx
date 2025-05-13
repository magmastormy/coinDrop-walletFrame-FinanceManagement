import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
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
import ImageService from '../../../services/imageService';
import { toast } from 'react-toastify';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

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

const CreateEditEducationPost = ({ onSubmit, onClose, initialData = null }) => {
    const post = initialData;
    const { theme } = useTheme();
    const [title, setTitle] = useState('');
    const [imageFiles, setImageFiles] = useState([]);
    const [uploadedImages, setUploadedImages] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const isEditMode = !!post;
    const [isUploading, setIsUploading] = useState(false);

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
            
            // Show loading state
            setIsUploading(true);
            
            const response = await ImageService.uploadImage(file, 'education');
            console.log("[CreateEditEducation] Image uploaded response:", response);
            
            // Check for valid response data
            if (!response || !response.url) {
                throw new Error('[CreateEditEducation] Invalid image upload response');
            }
            
            // Update the UI state
            setImageFiles(prev => [...prev, file]);
            
            setUploadedImages(prev => [...prev, {
                preview: URL.createObjectURL(file),
                url: response.url,
                _id: response._id || response.publicId,
                file
            }]);
            
            // Return the image URL for content embedding
            return response.url;
        } catch (error) {
            console.error('[CreateEditEducation] Error uploading image:', error);
            return null;
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isSubmitting) return;
            setIsSubmitting(true);
            setError('');
            
            // Validate required fields
            if (!title.trim()) {
                setError('Title is required');
                setIsSubmitting(false);
                return;
            }
            
            // First, upload any pending images
            let processedContent = editor.getHTML();
            const pendingImagesToUpload = uploadedImages.filter(img => img.file && !img.isUploaded && img.pendingUpload);
            console.log('[CreateEditEducation] Pending images to upload:', pendingImagesToUpload.length);
            
            // Upload all pending images first
            if (pendingImagesToUpload.length > 0) {
                toast.info(`Uploading ${pendingImagesToUpload.length} image(s)...`);
                
                // Upload each image and get the URLs
                const uploadResults = [];
                for (const img of pendingImagesToUpload) {
                    try {
                        const uploadedImage = await ImageService.uploadImage(img.file, 'education');
                        if (uploadedImage && uploadedImage.url) {
                            // Replace the blob URL in the content with the actual uploaded URL
                            processedContent = processedContent.replace(img.preview, uploadedImage.url);
                            uploadResults.push({
                                ...uploadedImage,
                                tempId: img.tempId,
                                originalPreview: img.preview
                            });
                        }
                    } catch (uploadError) {
                        console.error('Error uploading image:', uploadError);
                        toast.error(`Failed to upload image: ${uploadError.message || 'Unknown error'}`);
                    }
                }
                
                console.log('[CreateEditEducation] Uploaded images:', uploadResults);
            }
            
            // Create the post data with the processed content that has real image URLs
            const postData = {
                title: title,
                details: processedContent,
                // No need to include pendingImages as they've been uploaded and URLs replaced in the content
                existingImageIds: uploadedImages
                    .filter(img => img.isExisting && img._id)
                    .map(img => img._id)
            };
            
            if (isEditMode && post) {
                postData._id = post._id;
            }
            
            console.log('[CreateEditEducationPost] Submitting education post data:', postData);
            
            // Save the post through the provided onSubmit handler
            let response;
            try {
                if (isEditMode) {
                    console.log("***[CreateEditEducationPost] update post");
                    response = await onSubmit(post._id, postData);
                } else {
                    console.log("***[CreateEditEducationPost] create new post");
                    response = await onSubmit(postData);
                }
                
                console.log('[CreateEditEducationPost] Education post (onSubmit) response:', response);
                
                // Handle the response
                if (response) {
                    // Clean up any object URLs created for previews
                    uploadedImages.forEach(img => {
                        if (img.preview && typeof img.preview === 'string') {
                            URL.revokeObjectURL(img.preview);
                        }
                    });
                    
                    onClose();
                } else {
                    throw new Error('[CreateEditEducation] Failed to save post');
                }
            } catch (submitError) {
                console.error('[CreateEditEducation] Error submitting education post:', submitError);
                throw submitError; // Rethrow to be caught by the outer catch
            }
        } catch (err) {
            console.error('[CreateEditEducation] Error saving education post:', err);
            setError('[CreateEditEducation] Error saving post: ' + (err.message || 'Unknown error'));
            toast.error('[CreateEditEducation] Error saving post');
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

MenuBar.propTypes = {
    editor: PropTypes.object,
    theme: PropTypes.object.isRequired,
    setImageFiles: PropTypes.func.isRequired,
    setUploadedImages: PropTypes.func.isRequired
};

CreateEditEducationPost.propTypes = {
    onSubmit: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
    initialData: PropTypes.object
};

export default CreateEditEducationPost;