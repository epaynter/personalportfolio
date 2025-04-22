import { useState, useEffect } from 'react';
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { toast } from 'react-hot-toast';
import ImageCropper from './ImageCropper';
import Editor from "@monaco-editor/react";
import KnowledgeBaseSection from './KnowledgeBaseSection';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import RichTextEditor from './RichTextEditor';

export default function AdminModal({ 
  categories, 
  projects, 
  heroData, 
  aboutData, 
  contactData, 
  onAddProject, 
  onEditProject, 
  onDeleteProject, 
  onAddCategory, 
  onUpdateHero, 
  onUpdateAbout, 
  onUpdateContact 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');
  const [password, setPassword] = useState('');
  const [localProjects, setLocalProjects] = useState(projects);
  const [project, setProject] = useState({ 
    title: '', 
    shortDescription: '', 
    longDescription: '', 
    image: '', 
    category: '', 
    link: '',
    content: [],
    selectedContentIndex: 0,
    tags: []
  });
  const [editingId, setEditingId] = useState(null);
  const [newCategory, setNewCategory] = useState('');
  const [hero, setHero] = useState({ name: heroData.name || '', tagline: heroData.tagline || '', avatar: heroData.avatar || '' });
  const [about, setAbout] = useState({
    content: aboutData?.content || '',
    image: aboutData?.image || ''
  });
  const [contact, setContact] = useState({
    emailPlaceholder: contactData.emailPlaceholder || 'Email',
    messagePlaceholder: contactData.messagePlaceholder || 'Message',
    submitText: contactData.submitText || 'Send',
    socialLinks: contactData.socialLinks || [{ name: 'LinkedIn', url: 'https://linkedin.com' }, { name: 'GitHub', url: 'https://github.com' }, { name: 'Instagram', url: 'https://instagram.com' }],
  });
  const [uploading, setUploading] = useState(false);
  const [showPasswordAuth, setShowPasswordAuth] = useState(false);
  const [activeTab, setActiveTab] = useState('knowledge');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [isUpdatingProjects, setIsUpdatingProjects] = useState(false);

  // Track changes in each section
  const [projectChanges, setProjectChanges] = useState({});
  const [categoryChanges, setCategoryChanges] = useState({});
  const [heroChanges, setHeroChanges] = useState({});
  const [aboutChanges, setAboutChanges] = useState({});
  const [contactChanges, setContactChanges] = useState({});

  const [uploadStatus, setUploadStatus] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [updateStatus, setUpdateStatus] = useState('idle');
  const [editingFile, setEditingFile] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [isCreatingNewFile, setIsCreatingNewFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileContent, setNewFileContent] = useState('');
  const [newFileExtension, setNewFileExtension] = useState('md');

  const [crop, setCrop] = useState({
    unit: '%',
    width: 90,
    height: 90,
    x: 5,
    y: 5,
    aspect: 1
  });
  const [imageRef, setImageRef] = useState(null);
  const [croppedImageUrl, setCroppedImageUrl] = useState(null);
  const [cropChanged, setCropChanged] = useState(false);
  const [tempCropArea, setTempCropArea] = useState(null);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [previewCrop, setPreviewCrop] = useState(null);
  const [showCrop, setShowCrop] = useState(false);
  const [aboutImagePreview, setAboutImagePreview] = useState(null);
  const [aboutChanged, setAboutChanged] = useState(false);
  const [showCropper, setShowCropper] = useState(null);

  const [fileDescription, setFileDescription] = useState('');
  const [showDescriptionInput, setShowDescriptionInput] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  // Assistant Questions state
  const [questions, setQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [questionError, setQuestionError] = useState('');
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [loading, setLoading] = useState(false);

  // Add Monaco Editor theme state
  const [editorTheme, setEditorTheme] = useState('light');

  const [isDragging, setIsDragging] = useState(false);
  const [draggedCategory, setDraggedCategory] = useState(null);
  const [isReorderingProjects, setIsReorderingProjects] = useState(false);
  const [defaultVoiceStyle, setDefaultVoiceStyle] = useState('neutral');

  const [editingCategory, setEditingCategory] = useState(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [localCategories, setLocalCategories] = useState(categories);

  // Initialize voice style from localStorage on client side
  useEffect(() => {
    const savedStyle = localStorage.getItem('assistant_voice_style');
    if (savedStyle) {
      setDefaultVoiceStyle(savedStyle);
    }
  }, []);

  useEffect(() => {
    // Save voice style to localStorage when it changes
    if (typeof window !== 'undefined') {
      localStorage.setItem('assistant_voice_style', defaultVoiceStyle);
    }
  }, [defaultVoiceStyle]);

  useEffect(() => {
    // Check if there are any unsaved changes
    const hasChanges = 
      Object.keys(projectChanges).length > 0 ||
      Object.keys(categoryChanges).length > 0 ||
      Object.keys(heroChanges).length > 0 ||
      Object.keys(aboutChanges).length > 0 ||
      Object.keys(contactChanges).length > 0;
    
    setHasUnsavedChanges(hasChanges);
  }, [projectChanges, categoryChanges, heroChanges, aboutChanges, contactChanges]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUploadedFiles();
      fetchQuestions();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    // Update editor theme based on system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setEditorTheme('vs-dark');
    }

    // Listen for theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleThemeChange = (e) => {
      setEditorTheme(e.matches ? 'vs-dark' : 'light');
    };
    mediaQuery.addListener(handleThemeChange);
    return () => mediaQuery.removeListener(handleThemeChange);
  }, []);

  useEffect(() => {
    setLocalProjects(projects);
  }, [projects]);

  useEffect(() => {
    setLocalCategories(categories);
  }, [categories]);

  const handleClose = async () => {
    if (cropChanged) {
      const shouldProceed = window.confirm('You have unsaved crop changes. Do you want to discard them?');
      if (!shouldProceed) {
        return;
      }
    }
    
    if (hasUnsavedChanges) {
      const shouldSave = window.confirm('You have unsaved changes. Would you like to save them before closing?');
      if (shouldSave) {
        await handleSaveAll();
      }
    }
    setIsOpen(false);
    setHasUnsavedChanges(false);
    setProjectChanges({});
    setCategoryChanges({});
    setHeroChanges({});
    setAboutChanges({});
    setContactChanges({});
    setCropChanged(false);
  };

  const handleSaveAll = async () => {
    setSaveStatus('saving');
    try {
      // Save all changes in parallel
      const savePromises = [];
      
      if (Object.keys(projectChanges).length > 0) {
        savePromises.push(onEditProject(editingId, project));
      }
      
      if (Object.keys(categoryChanges).length > 0) {
        savePromises.push(onAddCategory(newCategory));
      }
      
      if (Object.keys(heroChanges).length > 0) {
        savePromises.push(onUpdateHero(hero));
      }
      
      if (Object.keys(aboutChanges).length > 0) {
        savePromises.push(onUpdateAbout(about));
      }
      
      if (Object.keys(contactChanges).length > 0) {
        savePromises.push(onUpdateContact(contact));
      }
      
      if (savePromises.length > 0) {
        await Promise.all(savePromises);
      }

      setSaveStatus('saved');
      setHasUnsavedChanges(false);
      setProjectChanges({});
      setCategoryChanges({});
      setHeroChanges({});
      setAboutChanges({});
      setContactChanges({});
      
      toast.success('All changes saved successfully!');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (error) {
      console.error('Error saving changes:', error);
      setSaveStatus('error');
      toast.error('Failed to save changes');
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  const handlePasskeyRegistration = async () => {
    try {
      setIsRegistering(true);
      setError('');

      // Get registration options
      const optionsRes = await fetch('/api/webauthn/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!optionsRes.ok) {
        const data = await optionsRes.json();
        throw new Error(data.message || 'Registration failed');
      }

      const options = await optionsRes.json();
      console.log('Registration options:', options);

      // Start registration
      const credential = await startRegistration(options);
      console.log('Registration credential:', credential);

      // Verify registration
      const verificationRes = await fetch('/api/webauthn/verify-registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential }),
      });

      if (verificationRes.ok) {
        setIsAuthenticated(true);
      } else {
        const data = await verificationRes.json();
        throw new Error(data.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError(error.message || 'Registration failed. Please try again.');
      // If it's a browser compatibility issue, suggest using password auth
      if (error.name === 'NotSupportedError' || error.message.includes('not supported')) {
        setError('Your browser or device does not support Passkey authentication. Please use password authentication instead.');
        setShowPasswordAuth(true);
      }
    } finally {
      setIsRegistering(false);
    }
  };

  const handlePasskeyAuthentication = async () => {
    try {
      setError('');

      // Get authentication options
      const optionsRes = await fetch('/api/webauthn/authenticate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!optionsRes.ok) {
        const data = await optionsRes.json();
        throw new Error(data.message || 'Authentication failed');
      }

      const options = await optionsRes.json();

      // Start authentication
      const credential = await startAuthentication(options);

      // Verify authentication
      const verificationRes = await fetch('/api/webauthn/verify-authentication', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential }),
      });

      if (verificationRes.ok) {
        setIsAuthenticated(true);
      } else {
        const data = await verificationRes.json();
        throw new Error(data.message || 'Authentication failed');
      }
    } catch (error) {
      console.error('Authentication error:', error);
      setError(error.message || 'Authentication failed. Please try again.');
      setShowPasswordAuth(true);
    }
  };

  const handlePasswordSubmit = async () => {
    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      
      if (response.ok) {
        setIsAuthenticated(true);
      } else {
        const data = await response.json();
        throw new Error(data.message || 'Incorrect password');
      }
    } catch (error) {
      setError(error.message);
    }
  };

  const handleProjectSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Create a clean project object with only non-empty values
      const projectToSubmit = {};
      
      if (project.title) projectToSubmit.title = project.title;
      if (project.shortDescription) projectToSubmit.shortDescription = project.shortDescription;
      if (project.longDescription) projectToSubmit.longDescription = project.longDescription;
      if (project.category) projectToSubmit.category = project.category;
      if (project.link) projectToSubmit.link = project.link;
      if (project.image) projectToSubmit.image = project.image;
      if (project.content && project.content.length > 0) projectToSubmit.content = project.content;
      if (project.tags && project.tags.length > 0) projectToSubmit.tags = project.tags;
      
      // Check if we're editing an existing project
      if (editingId) {
        await onEditProject(editingId, projectToSubmit);
        setEditingId(null);
      } else {
        // Check for duplicate projects before adding
        const isDuplicate = localProjects.some(p => 
          p.title === projectToSubmit.title && 
          p.category === projectToSubmit.category
        );
        
        if (isDuplicate) {
          toast.error('A project with this title already exists in this category');
          return;
        }
        
        await onAddProject(projectToSubmit);
      }
      
      // Reset the form
      setProject({
        title: '',
        shortDescription: '',
        longDescription: '',
        image: '',
        category: '',
        link: '',
        content: [],
        selectedContentIndex: 0,
        tags: []
      });
      
      // Show success message
      toast.success(editingId ? 'Project updated successfully!' : 'Project added successfully!');
    } catch (error) {
      console.error('Error saving project:', error);
      toast.error('Failed to save project. Please try again.');
    }
  };

  const handleEditProject = (proj) => {
    setEditingId(proj._id);
    // Make sure we're creating a new object with all the necessary fields
    setProject({
      title: proj.title || '',
      shortDescription: proj.shortDescription || proj.description || '',
      longDescription: proj.longDescription || proj.description || '',
      image: proj.image || '',
      category: proj.category || '',
      link: proj.link || '',
      content: proj.content || (proj.image ? [{ 
        url: proj.image, 
        type: proj.image.match(/\.(jpg|jpeg|png|gif)$/i) ? 'image' : 'video' 
      }] : []),
      selectedContentIndex: 0,
      tags: proj.tags || []
    });
  };

  const handleDeleteProject = async (id) => {
    if (confirm('Are you sure you want to delete this project?')) {
      try {
        await onDeleteProject(id);
        // If we're deleting the project we're currently editing, reset the form
        if (editingId === id) {
          setEditingId(null);
          setProject({
            title: '',
            shortDescription: '',
            longDescription: '',
            image: '',
            category: '',
            link: '',
            content: [],
            selectedContentIndex: 0,
            tags: []
          });
        }
        toast.success('Project deleted successfully!');
      } catch (error) {
        console.error('Error deleting project:', error);
        toast.error('Failed to delete project');
      }
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (newCategory) {
      try {
        await onAddCategory(newCategory);
        setNewCategory('');
        toast.success('Category added successfully!');
      } catch (error) {
        console.error('Error adding category:', error);
        toast.error('Failed to add category');
      }
    }
  };

  const handleHeroSubmit = async (e) => {
    e.preventDefault();
    setHeroChanges(hero);
    setHasUnsavedChanges(true);
  };

  const handleAboutSubmit = async (e) => {
    e.preventDefault();
    if (showCrop) {
      alert('Please apply or cancel your crop changes before saving.');
      return;
    }
    
    try {
      // Call the onUpdateAbout function directly
      await onUpdateAbout(about);
      
      // Update state after successful save
      setAboutChanged(false);
      setAboutChanges({});
      setHasUnsavedChanges(false);
      toast.success('About section updated successfully!');
    } catch (error) {
      console.error('Error updating about section:', error);
      toast.error('Failed to update about section');
    }
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setContactChanges(contact);
    setHasUnsavedChanges(true);
  };

  const handleAddSocialLink = () => {
    setContact({
      ...contact,
      socialLinks: [...contact.socialLinks, { name: '', url: '' }],
    });
  };

  const handleRemoveSocialLink = (index) => {
    const updatedLinks = [...contact.socialLinks];
    updatedLinks.splice(index, 1);
    setContact({ ...contact, socialLinks: updatedLinks });
  };

  const handleSocialLinkChange = (index, field, value) => {
    const updatedLinks = [...contact.socialLinks];
    updatedLinks[index][field] = value;
    setContact({ ...contact, socialLinks: updatedLinks });
  };

  const handleProjectImageChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    for (const file of files) {
      try {
        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        // Log the file being sent
        console.log('Sending file:', {
          name: file.name,
          type: file.type,
          size: file.size
        });

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
          // Remove any Content-Type header to let the browser set it with the boundary
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Upload failed');
        }

        const data = await response.json();
        const fileType = file.type.startsWith('image/') ? 'image' : 
                        file.type.startsWith('video/') ? 'video' :
                        file.type.includes('pdf') ? 'pdf' :
                        file.type.includes('document') || file.type.includes('spreadsheet') || file.type.includes('presentation') ? 'document' :
                        file.type.includes('text') || file.type.includes('json') ? 'text' :
                        file.type.includes('zip') || file.type.includes('rar') ? 'archive' : 'other';

        // Add the new content to the content array
        const newContent = [...project.content, { 
          url: data.url, 
          type: fileType,
          name: file.name,
          thumbnailUrl: data.thumbnailUrl // Store the thumbnail URL if available
        }];
        
        // Set the project image based on the file type and available thumbnails
        let projectImage = newContent[project.selectedContentIndex].url;
        if (fileType === 'pdf' && data.thumbnailUrl) {
          projectImage = data.thumbnailUrl;
        }
        
        setProject({ 
          ...project, 
          content: newContent,
          image: projectImage
        });
      } catch (error) {
        console.error('Upload error:', error);
        alert(`Error uploading ${file.name}: ${error.message}`);
      }
    }
    setUploading(false);
  };

  const handleContentSelection = (index) => {
    setProject({
      ...project,
      selectedContentIndex: index,
      image: project.content[index].url // Update the main image to the selected content
    });
  };

  const handleRemoveContent = (index) => {
    const newContent = [...project.content];
    newContent.splice(index, 1);
    
    // If we're removing the selected content, update the selection
    let newSelectedIndex = project.selectedContentIndex;
    if (index === project.selectedContentIndex) {
      newSelectedIndex = Math.min(index, newContent.length - 1);
    } else if (index < project.selectedContentIndex) {
      newSelectedIndex--;
    }
    
    setProject({
      ...project,
      content: newContent,
      selectedContentIndex: newSelectedIndex,
      image: newContent.length > 0 ? newContent[newSelectedIndex].url : ''
    });
  };

  const handleHeroAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const avatarUrl = await handleFileUpload(file, 'image');
      if (avatarUrl) {
        setHero({ ...hero, avatar: avatarUrl });
      }
    }
  };

  const fetchUploadedFiles = async () => {
    try {
      const res = await fetch('/api/assistant-files', {
        headers: {
          'Authorization': `Bearer ${password}`,
        },
      });
      if (!res.ok) {
        throw new Error('Failed to fetch uploaded files');
      }
      const data = await res.json();
      setUploadedFiles(data);
    } catch (error) {
      console.error('Error fetching uploaded files:', error);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Check file type
    const fileType = file.name.split('.').pop().toLowerCase();
    const isTextFile = ['md', 'txt', 'json', 'csv'].includes(fileType);
    const isImageFile = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(fileType);
    const isDocumentFile = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(fileType);
    
    if (!isTextFile && !isImageFile && !isDocumentFile) {
      setUploadStatus('error');
      toast.error('Only text, image, and document files are allowed');
      return;
    }

    // For non-text files, show description input
    if (!isTextFile) {
      setSelectedFile(file);
      setShowDescriptionInput(true);
      return;
    }

    // For text files, proceed with upload
    uploadFile(file);
  };

  const uploadFile = async (file, description = '') => {
    setUploadStatus('uploading');
    const formData = new FormData();
    formData.append('file', file);
    if (description) {
      formData.append('description', description);
    }

    try {
      const res = await fetch('/api/upload-assistant-file', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_ADMIN_PASSWORD}`,
        },
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Upload failed');
      }

      const data = await res.json();
      setUploadStatus('success');
      fetchUploadedFiles(); // Refresh the list
      setTimeout(() => setUploadStatus(''), 3000);
      
      // Reset state
      setShowDescriptionInput(false);
      setSelectedFile(null);
      setFileDescription('');
    } catch (error) {
      console.error('Error uploading file:', error);
      setUploadStatus('error');
      setTimeout(() => setUploadStatus(''), 3000);
    }
  };

  const handleDescriptionSubmit = () => {
    if (selectedFile) {
      uploadFile(selectedFile, fileDescription);
    }
  };

  const handleUpdateProjects = async () => {
    setIsUpdatingProjects(true);
    
    try {
      // 1. Fetch all current portfolio projects
      const response = await fetch('/api/projects');
      if (!response.ok) throw new Error('Failed to fetch projects');
      
      const projects = await response.json();
      
      // 2. Convert project data into a readable format
      let formattedContent = '';
      
      projects.forEach(project => {
        formattedContent += `---
Title: ${project.title || 'Untitled Project'}
Description: ${project.shortDescription || project.description || 'No description available'}
Tech: ${project.category || 'Not specified'}
URL: ${project.link || 'Not available'}
`;
      });
      
      // 3 & 4. Check if portfolio-projects.txt exists and update/replace it
      const updateResponse = await fetch('/api/update-assistant-knowledge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${password}`,
        },
        body: JSON.stringify({
          filename: 'portfolio-projects.txt',
          content: formattedContent,
          description: 'Current portfolio projects for the assistant to reference'
        }),
      });
      
      if (!updateResponse.ok) {
        const errorData = await updateResponse.json();
        throw new Error(errorData.error || 'Failed to update assistant knowledge');
      }
      
      // 5. Show confirmation toast
      toast.success('Assistant knowledge base updated with latest portfolio projects');
      
    } catch (error) {
      console.error('Error updating projects:', error);
      toast.error(`Failed to update projects: ${error.message}`);
    } finally {
      setIsUpdatingProjects(false);
    }
  };

  const onImageLoad = (image) => {
    setImageRef(image);
    setImageDimensions({
      width: image.width,
      height: image.height
    });
    return false;
  };

  const handleCropComplete = (croppedArea, croppedAreaPixels) => {
    // Store the exact pixel values of the crop area
    console.log('Crop area pixels:', croppedAreaPixels);
    setTempCropArea(croppedAreaPixels);
    setCropChanged(true);
    
    // Create a preview of the cropped area
    const canvas = document.createElement('canvas');
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.src = about.image;
    image.onload = () => {
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;
      
      canvas.width = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;
      
      const ctx = canvas.getContext('2d');
      
      // Log the exact values being used for the preview
      console.log('Preview crop values:', {
        sourceX: croppedAreaPixels.x * scaleX,
        sourceY: croppedAreaPixels.y * scaleY,
        sourceWidth: croppedAreaPixels.width * scaleX,
        sourceHeight: croppedAreaPixels.height * scaleY,
        destWidth: croppedAreaPixels.width,
        destHeight: croppedAreaPixels.height
      });
      
      // Draw the exact crop area
      ctx.drawImage(
        image,
        croppedAreaPixels.x * scaleX,
        croppedAreaPixels.y * scaleY,
        croppedAreaPixels.width * scaleX,
        croppedAreaPixels.height * scaleY,
        0,
        0,
        croppedAreaPixels.width,
        croppedAreaPixels.height
      );
      
      const previewUrl = canvas.toDataURL('image/jpeg');
      setPreviewCrop(previewUrl);
    };
  };

  const applyCrop = async () => {
    if (!tempCropArea) {
      toast.error('Please select a crop area first');
      return;
    }

    try {
      setUploading(true);
      toast.loading('Processing image...');
      
      // Create a new image element to load the source image
      const image = new Image();
      image.crossOrigin = 'anonymous';
      
      // Create a promise to handle the image loading
      const imageLoaded = new Promise((resolve, reject) => {
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error('Failed to load image'));
        image.src = about.image;
      });
      
      // Wait for the image to load
      const loadedImage = await imageLoaded;
      
      // Calculate scale factors
      const scaleX = loadedImage.naturalWidth / loadedImage.width;
      const scaleY = loadedImage.naturalHeight / loadedImage.height;
      
      // Create a canvas with the exact dimensions of the crop area
      const canvas = document.createElement('canvas');
      canvas.width = tempCropArea.width;
      canvas.height = tempCropArea.height;
      
      // Get the canvas context
      const ctx = canvas.getContext('2d');
      
      // Log the exact values being used for the final crop
      console.log('Final crop values:', {
        sourceX: tempCropArea.x * scaleX,
        sourceY: tempCropArea.y * scaleY,
        sourceWidth: tempCropArea.width * scaleX,
        sourceHeight: tempCropArea.height * scaleY,
        destWidth: tempCropArea.width,
        destHeight: tempCropArea.height
      });
      
      // Draw the exact crop area
      ctx.drawImage(
        loadedImage,
        tempCropArea.x * scaleX,
        tempCropArea.y * scaleY,
        tempCropArea.width * scaleX,
        tempCropArea.height * scaleY,
        0,
        0,
        tempCropArea.width,
        tempCropArea.height
      );
      
      // Convert canvas to blob
      const blob = await new Promise((resolve) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(new Error('Canvas is empty'));
              return;
            }
            blob.name = 'cropped.jpeg';
            resolve(blob);
          },
          'image/jpeg',
          1
        );
      });
      
      // Create form data and append the blob
      const formData = new FormData();
      formData.append('file', blob, 'cropped.jpeg');

      // Upload the cropped image
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const data = await response.json();
      
      // Update the about state with the new image URL
      setAbout(prev => ({ ...prev, image: data.url }));
      
      // Reset crop state
      setCrop({ unit: '%', width: 90, height: 90, x: 5, y: 5, aspect: 1 });
      setCroppedImageUrl(null);
      setTempCropArea(null);
      setCropChanged(false);
      setPreviewCrop(null);
      
      // Show success message
      toast.success('Image cropped and uploaded successfully!');
      
      // Update the about changes to trigger save
      setAboutChanges(about);
      setHasUnsavedChanges(true);
    } catch (error) {
      console.error('Error uploading cropped image:', error);
      toast.error('Failed to upload cropped image');
    } finally {
      setUploading(false);
      toast.dismiss();
    }
  };

  const handleCropChange = (newCrop) => {
    setCrop(newCrop);
  };

  const resetCrop = () => {
    setAbout({ ...about, image: '' });
    setCroppedImageUrl(null);
    setCrop({
      unit: '%',
      width: 90,
      height: 90,
      x: 5,
      y: 5,
      aspect: 1
    });
    setCropChanged(false);
    setTempCropArea(null);
    setPreviewCrop(null);
  };

  const handleAboutImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setAboutImagePreview(reader.result);
        setShowCrop(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteFile = async (fileId) => {
    if (!confirm('Are you sure you want to delete this file?')) {
      return;
    }

    try {
      const response = await fetch('/api/delete-assistant-file', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_ADMIN_PASSWORD}`,
        },
        body: JSON.stringify({ fileId }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete file');
      }

      // Refresh the uploaded files list
      await fetchUploadedFiles();
    } catch (error) {
      console.error('Error deleting file:', error);
      setError('Failed to delete file');
    }
  };

  const handleEditFile = async (file) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/assistant-files/${file.id}`, {
        headers: {
          'Authorization': `Bearer ${process.env.ADMIN_PASSWORD}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(`Failed to fetch file content: ${errorData.error}`);
        return;
      }

      const data = await response.json();
      setEditingFile({
        id: file.id,
        content: data.content,
        filename: file.filename,
        extension: file.filename.split('.').pop()
      });
      setIsEditing(true);
    } catch (error) {
      console.error('Error fetching file content:', error);
      toast.error('Failed to fetch file content. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/update-assistant-file', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.ADMIN_PASSWORD}`,
        },
        body: JSON.stringify({
          fileId: editingFile.id,
          content: editingFile.content
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(`Failed to save changes: ${errorData.error}`);
        return;
      }

      await fetchUploadedFiles();
      setIsEditing(false);
      setEditingFile(null);
      toast.success('File updated successfully');
    } catch (error) {
      console.error('Error saving file:', error);
      toast.error('Failed to save changes. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpdate = async (fileId, content) => {
    try {
      const response = await fetch('/api/update-assistant-file', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_ADMIN_PASSWORD}`,
        },
        body: JSON.stringify({ fileId, content }),
      });

      if (!response.ok) {
        throw new Error('Failed to update file');
      }

      // Refresh the uploaded files list
      await fetchUploadedFiles();
    } catch (error) {
      console.error('Error updating file:', error);
      setError('Failed to update file');
    }
  };

  const handleFileDelete = async (fileId) => {
    if (!confirm('Are you sure you want to delete this file?')) {
      return;
    }

    try {
      const response = await fetch('/api/delete-assistant-file', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_ADMIN_PASSWORD}`,
        },
        body: JSON.stringify({ fileId }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete file');
      }

      // Refresh the uploaded files list
      await fetchUploadedFiles();
    } catch (error) {
      console.error('Error deleting file:', error);
      setError('Failed to delete file');
    }
  };

  const fetchQuestions = async () => {
    try {
      setIsLoadingQuestions(true);
      const response = await fetch('/api/assistant-questions', {
        headers: {
          'Authorization': `Bearer ${process.env.ADMIN_PASSWORD}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch questions');
      }

      const data = await response.json();
      setAssistantQuestions(data);
    } catch (error) {
      console.error('Error fetching questions:', error);
      setError('Failed to fetch questions');
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    if (!newQuestion.trim()) return;

    try {
      const response = await fetch('/api/assistant-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: newQuestion }),
      });

      if (!response.ok) {
        throw new Error('Failed to add question');
      }

      const addedQuestion = await response.json();
      setQuestions([...questions, addedQuestion]);
      setNewQuestion('');
      setQuestionError('');
    } catch (error) {
      console.error('Error adding question:', error);
      setQuestionError('Failed to add question');
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    try {
      const response = await fetch(`/api/assistant-questions/${questionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete question');
      }

      setQuestions(questions.filter(q => q._id !== questionId));
      setQuestionError('');
    } catch (error) {
      console.error('Error deleting question:', error);
      setQuestionError('Failed to delete question');
    }
  };

  const handleCreateNewFile = () => {
    setIsCreatingNewFile(true);
    setNewFileName('');
    setNewFileContent('');
    setNewFileExtension('md');
  };

  const handleSaveNewFile = async () => {
    if (!newFileName.trim()) {
      toast.error('Please enter a file name');
      return;
    }

    setUploadStatus('uploading');
    
    try {
      // Create a file object from the content
      const file = new File(
        [newFileContent], 
        `${newFileName}.${newFileExtension}`, 
        { type: 'text/plain' }
      );
      
      // Upload the file
      await uploadFile(file);
      
      // Reset state
      setIsCreatingNewFile(false);
      setNewFileName('');
      setNewFileContent('');
      setNewFileExtension('md');
      
      toast.success('File created successfully!');
    } catch (error) {
      console.error('Error creating file:', error);
      toast.error('Failed to create file');
    } finally {
      setUploadStatus('');
    }
  };

  const handleDragStart = (e, category) => {
    setIsDragging(true);
    setDraggedCategory(category);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, targetCategory) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (!draggedCategory || draggedCategory._id === targetCategory._id) return;
    
    const newCategories = [...categories];
    const draggedIndex = newCategories.findIndex(c => c._id === draggedCategory._id);
    const targetIndex = newCategories.findIndex(c => c._id === targetCategory._id);
    
    // Remove dragged item and insert at new position
    newCategories.splice(draggedIndex, 1);
    newCategories.splice(targetIndex, 0, draggedCategory);
    
    // Update positions
    const updatedCategories = newCategories.map((category, index) => ({
      ...category,
      position: index
    }));
    
    setCategories(updatedCategories);
    
    // Update positions in database
    try {
      await Promise.all(updatedCategories.map(category => 
        fetch('/api/categories', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            _id: category._id,
            updates: { position: category.position }
          })
        })
      ));
    } catch (error) {
      console.error('Error updating category positions:', error);
    }
  };

  const handleCategoryReorder = async (reorderedCategories) => {
    try {
      // Format categories for the API
      const formattedCategories = reorderedCategories.map((category, index) => ({
        _id: category._id,
        position: index
      }));

      const response = await fetch('/api/categories/reorder', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ categories: formattedCategories }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update category positions');
      }

      const data = await response.json();
      
      // Update the categories state with the returned categories
      if (data.categories) {
        setLocalCategories(data.categories);
        setHasUnsavedChanges(true);
      } else {
        // If the API doesn't return categories, update the local state with the reordered categories
        setLocalCategories(reorderedCategories);
        setHasUnsavedChanges(true);
      }
    } catch (error) {
      console.error('Error reordering categories:', error);
      alert('Failed to update category positions. Please try again.');
    }
  };

  const handleProjectReorder = async (categoryId, reorderedProjects) => {
    try {
      const response = await fetch('/api/projects/reorder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projects: reorderedProjects.map((project, index) => ({
            _id: project._id,
            position: index,
            categoryId
          }))
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to reorder projects');
      }

      const updatedProjects = await response.json();
      setLocalProjects(updatedProjects);
      toast.success('Projects reordered successfully');
    } catch (error) {
      console.error('Error reordering projects:', error);
      toast.error('Failed to reorder projects');
    }
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category._id);
    setEditingCategoryName(category.name);
  };

  const handleUpdateCategory = async (categoryId) => {
    try {
      const response = await fetch('/api/categories', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          _id: categoryId,
          updates: { name: editingCategoryName }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update category');
      }

      const updatedCategory = await response.json();
      const newCategories = localCategories.map(cat => 
        cat._id === categoryId ? { ...cat, name: editingCategoryName } : cat
      );
      setLocalCategories(newCategories);
      setEditingCategory(null);
      setEditingCategoryName('');
      toast.success('Category updated successfully');
    } catch (error) {
      console.error('Error updating category:', error);
      toast.error('Failed to update category');
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!confirm('Are you sure you want to delete this category? This will also delete all projects in this category.')) {
      return;
    }

    try {
      const response = await fetch('/api/categories', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ _id: categoryId })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete category');
      }

      // Remove the category from local state
      const newCategories = localCategories.filter(cat => cat._id !== categoryId);
      setLocalCategories(newCategories);
      toast.success('Category deleted successfully');
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error(error.message || 'Failed to delete category');
    }
  };

  if (!isOpen) {
    return (
      <button
        className="fixed bottom-4 right-4 bg-gray-200 text-black px-4 py-2 opacity-0 hover:opacity-100 transition-opacity z-50"
        onClick={() => setIsOpen(true)}
      >
        Admin
      </button>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
        <div className="bg-white p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4">Admin Authentication</h2>
          {error && (
            <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
              {error}
            </div>
          )}
          <div className="space-y-4">
            {!showPasswordAuth ? (
              <>
                <button
                  onClick={handlePasskeyAuthentication}
                  className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  Sign in with Passkey
                </button>
                <button
                  onClick={handlePasskeyRegistration}
                  disabled={isRegistering}
                  className="w-full bg-gray-200 text-black px-4 py-2 rounded hover:bg-gray-300 disabled:opacity-50"
                >
                  {isRegistering ? 'Registering...' : 'Register New Passkey'}
                </button>
                <button
                  onClick={() => setShowPasswordAuth(true)}
                  className="w-full bg-gray-300 text-black px-4 py-2 rounded hover:bg-gray-400"
                >
                  Use Password Instead
                </button>
              </>
            ) : (
              <>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full p-2 border border-gray-300 rounded"
                />
                <div className="flex space-x-2">
                  <button
                    onClick={handlePasswordSubmit}
                    className="flex-1 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                  >
                    Submit
                  </button>
                  <button
                    onClick={() => {
                      setShowPasswordAuth(false);
                      setError('');
                      setPassword('');
                    }}
                    className="flex-1 bg-gray-300 text-black px-4 py-2 rounded hover:bg-gray-400"
                  >
                    Back
                  </button>
                </div>
              </>
            )}
            <button
              onClick={() => {
                setIsOpen(false);
                setShowPasswordAuth(false);
                setError('');
                setPassword('');
              }}
              className="w-full bg-gray-300 text-black px-4 py-2 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'projects', label: 'Projects' },
    { id: 'categories', label: 'Categories' },
    { id: 'hero', label: 'Hero Section' },
    { id: 'about', label: 'About Section' },
    { id: 'contact', label: 'Contact Section' },
    { id: 'assistant', label: 'Assistant Files' },
    { id: 'questions', label: 'Assistant Questions' }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
          >
            <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Admin Panel</h2>
              <button
                onClick={handleClose}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <div className="flex overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
                <div className="flex min-w-full">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      className={`px-4 py-2 text-sm font-medium whitespace-nowrap flex-shrink-0 transition-colors duration-200 ${
                        activeTab === tab.id
                          ? 'text-primary-600 border-b-2 border-primary-600 bg-gray-50 dark:bg-gray-700'
                          : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                      onClick={() => setActiveTab(tab.id)}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex-1 overflow-auto p-4">
              {activeTab === 'projects' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Projects</h3>
                  <form onSubmit={handleProjectSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
                      <input
                        type="text"
                        value={project.title}
                        onChange={(e) => setProject({ ...project, title: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Short Description</label>
                      <RichTextEditor
                        content={project.shortDescription}
                        onChange={(content) => setProject({ ...project, shortDescription: content })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Long Description</label>
                      <RichTextEditor
                        content={project.longDescription}
                        onChange={(content) => setProject({ ...project, longDescription: content })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
                      <select
                        value={project.category}
                        onChange={(e) => setProject({ ...project, category: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      >
                        <option value="">Select a category</option>
                        {categories.map((category, index) => (
                          <option key={index} value={typeof category === 'string' ? category : category._id}>
                            {typeof category === 'string' ? category : category.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Link</label>
                      <input
                        type="url"
                        value={project.link}
                        onChange={(e) => setProject({ ...project, link: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Content</label>
                      <input
                        type="file"
                        onChange={handleProjectImageChange}
                        accept="image/*,.pdf"
                        className="mt-1 block w-full text-sm text-gray-500 dark:text-gray-400
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-md file:border-0
                          file:text-sm file:font-semibold
                          file:bg-primary-50 file:text-primary-700
                          hover:file:bg-primary-100
                          dark:file:bg-primary-900 dark:file:text-primary-300"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tags</label>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {project.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300"
                          >
                            {tag}
                            <button
                              type="button"
                              onClick={() => {
                                const newTags = [...project.tags];
                                newTags.splice(index, 1);
                                setProject({ ...project, tags: newTags });
                              }}
                              className="ml-2 text-primary-500 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-200"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                        <input
                          type="text"
                          placeholder="Add a tag"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && e.target.value.trim()) {
                              e.preventDefault();
                              const newTag = e.target.value.trim();
                              if (!project.tags.includes(newTag)) {
                                setProject({
                                  ...project,
                                  tags: [...project.tags, newTag]
                                });
                              }
                              e.target.value = '';
                            }
                          }}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Press Enter to add a tag
                      </p>
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      >
                        {editingId ? 'Update Project' : 'Add Project'}
                      </button>
                    </div>
                  </form>
                  
                  <div className="mt-8">
                    <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">Existing Projects</h4>
                    
                    {categories.map((category) => {
                      const categoryProjects = localProjects.filter(proj => proj.category === category._id);
                      
                      return (
                        <div key={category._id} className="mb-8">
                          <h5 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-3">{category.name}</h5>
                          
                          <DragDropContext onDragEnd={(result) => {
                            if (!result.destination) return;
                            
                            const items = Array.from(categoryProjects);
                            const [reorderedItem] = items.splice(result.source.index, 1);
                            items.splice(result.destination.index, 0, reorderedItem);
                            
                            handleProjectReorder(category._id, items);
                          }}>
                            <Droppable droppableId={`category-${category._id}`}>
                              {(provided) => (
                                <div
                                  {...provided.droppableProps}
                                  ref={provided.innerRef}
                                  className="space-y-2"
                                >
                                  {categoryProjects.map((proj, index) => (
                                    <Draggable key={proj._id} draggableId={proj._id} index={index}>
                                      {(provided) => (
                                        <div
                                          ref={provided.innerRef}
                                          {...provided.draggableProps}
                                          {...provided.dragHandleProps}
                                          className="border border-gray-200 dark:border-gray-700 rounded-md p-4 bg-white dark:bg-gray-800 shadow-sm"
                                        >
                                          <div className="flex justify-between items-start">
                                            <div>
                                              <h5 className="text-lg font-medium text-gray-900 dark:text-white">{proj.title}</h5>
                                              <p className="text-sm text-gray-500 dark:text-gray-400">{proj.shortDescription}</p>
                                            </div>
                                            <div className="flex space-x-2">
                                              <button
                                                onClick={() => handleEditProject(proj)}
                                                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                              >
                                                Edit
                                              </button>
                                              <button
                                                onClick={() => handleDeleteProject(proj._id)}
                                                className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                              >
                                                Delete
                                              </button>
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                    </Draggable>
                                  ))}
                                  {provided.placeholder}
                                </div>
                              )}
                            </Droppable>
                          </DragDropContext>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {activeTab === 'categories' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Categories</h3>
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold mb-4">Categories</h3>
                    <DragDropContext onDragEnd={(result) => {
                      if (!result.destination) return;
                      
                      const items = Array.from(categories);
                      const [reorderedItem] = items.splice(result.source.index, 1);
                      items.splice(result.destination.index, 0, reorderedItem);
                      
                      handleCategoryReorder(items);
                    }}>
                      <Droppable droppableId="categories">
                        {(provided) => (
                          <div
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            className="space-y-2"
                          >
                            {localCategories.map((category, index) => (
                              <Draggable
                                key={category._id}
                                draggableId={category._id}
                                index={index}
                              >
                                {(provided) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className="flex items-center justify-between p-2 bg-gray-100 rounded"
                                  >
                                    {editingCategory === category._id ? (
                                      <div className="flex-1 flex items-center space-x-2">
                                        <input
                                          type="text"
                                          value={editingCategoryName}
                                          onChange={(e) => setEditingCategoryName(e.target.value)}
                                          className="flex-1 px-2 py-1 border rounded"
                                          autoFocus
                                        />
                                        <button
                                          onClick={() => handleUpdateCategory(category._id)}
                                          className="text-green-500 hover:text-green-700"
                                        >
                                          Save
                                        </button>
                                        <button
                                          onClick={() => {
                                            setEditingCategory(null);
                                            setEditingCategoryName('');
                                          }}
                                          className="text-gray-500 hover:text-gray-700"
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    ) : (
                                      <>
                                        <span>{category.name}</span>
                                        <div className="flex space-x-2">
                                          <button
                                            onClick={() => handleEditCategory(category)}
                                            className="text-blue-500 hover:text-blue-700"
                                          >
                                            Edit
                                          </button>
                                          <button
                                            onClick={() => handleDeleteCategory(category._id)}
                                            className="text-red-500 hover:text-red-700"
                                          >
                                            Delete
                                          </button>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </DragDropContext>
                    
                    <form onSubmit={handleAddCategory} className="flex gap-2">
                      <input
                        type="text"
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        placeholder="New category name"
                        className="flex-1 px-3 py-2 border rounded"
                        required
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600"
                      >
                        Add
                      </button>
                    </form>
                  </div>
                </div>
              )}
              
              {activeTab === 'hero' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Hero Section</h3>
                  <form onSubmit={handleHeroSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                      <input
                        type="text"
                        value={hero.name}
                        onChange={(e) => setHero({ ...hero, name: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tagline</label>
                      <input
                        type="text"
                        value={hero.tagline}
                        onChange={(e) => setHero({ ...hero, tagline: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Avatar</label>
                      <input
                        type="file"
                        onChange={handleHeroAvatarChange}
                        accept="image/*"
                        className="mt-1 block w-full text-sm text-gray-500 dark:text-gray-400
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-md file:border-0
                          file:text-sm file:font-semibold
                          file:bg-primary-50 file:text-primary-700
                          hover:file:bg-primary-100
                          dark:file:bg-primary-900 dark:file:text-primary-300"
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      >
                        Update Hero Section
                      </button>
                    </div>
                  </form>
                </div>
              )}
              
              {activeTab === 'about' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">About Section</h3>
                  <form onSubmit={handleAboutSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">About Me Text</label>
                      <RichTextEditor
                        content={about.content}
                        onChange={(content) => setAbout({ ...about, content })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Image</label>
                      <input
                        type="file"
                        onChange={handleAboutImageChange}
                        accept="image/*"
                        className="mt-1 block w-full text-sm text-gray-500 dark:text-gray-400
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-md file:border-0
                          file:text-sm file:font-semibold
                          file:bg-primary-50 file:text-primary-700
                          hover:file:bg-primary-100
                          dark:file:bg-primary-900 dark:file:text-primary-300"
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      >
                        Update About Section
                      </button>
                    </div>
                  </form>
                  {showCrop && aboutImagePreview && (
                    <ImageCropper
                      image={aboutImagePreview}
                      onCropComplete={async (croppedImageUrl) => {
                        try {
                          // Convert base64 to blob
                          const response = await fetch(croppedImageUrl);
                          const blob = await response.blob();
                          
                          // Create a new file from the blob
                          const file = new File([blob], 'about-image.jpg', { type: 'image/jpeg' });
                          
                          // Upload the file
                          const formData = new FormData();
                          formData.append('file', file);
                          
                          const uploadResponse = await fetch('/api/upload', {
                            method: 'POST',
                            body: formData
                          });
                          
                          if (!uploadResponse.ok) {
                            throw new Error('Failed to upload image');
                          }
                          
                          const { url } = await uploadResponse.json();
                          
                          // Update the about state with the uploaded image URL
                          setAbout({ ...about, image: url });
                          setShowCrop(false);
                          setAboutImagePreview(null);
                          setAboutChanged(true);
                          setHasUnsavedChanges(true);
                          toast.success('Image cropped and uploaded successfully!');
                        } catch (error) {
                          console.error('Error processing cropped image:', error);
                          toast.error('Failed to process cropped image. Please try again.');
                        }
                      }}
                      onCancel={() => {
                        setShowCrop(false);
                        setAboutImagePreview(null);
                      }}
                    />
                  )}
                </div>
              )}
              
              {activeTab === 'contact' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Contact Section</h3>
                  <form onSubmit={handleContactSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email Placeholder</label>
                      <input
                        type="text"
                        value={contact.emailPlaceholder}
                        onChange={(e) => setContact({ ...contact, emailPlaceholder: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Message Placeholder</label>
                      <input
                        type="text"
                        value={contact.messagePlaceholder}
                        onChange={(e) => setContact({ ...contact, messagePlaceholder: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Submit Button Text</label>
                      <input
                        type="text"
                        value={contact.submitText}
                        onChange={(e) => setContact({ ...contact, submitText: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        required
                      />
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Social Links</label>
                        <button
                          type="button"
                          onClick={handleAddSocialLink}
                          className="text-sm text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300"
                        >
                          Add Link
                        </button>
                      </div>
                      <div className="space-y-2">
                        {contact.socialLinks.map((link, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={link.name}
                              onChange={(e) => handleSocialLinkChange(index, 'name', e.target.value)}
                              placeholder="Name"
                              className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                            <input
                              type="url"
                              value={link.url}
                              onChange={(e) => handleSocialLinkChange(index, 'url', e.target.value)}
                              placeholder="URL"
                              className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveSocialLink(index)}
                              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      >
                        Update Contact Section
                      </button>
                    </div>
                  </form>
                </div>
              )}
              
              {activeTab === 'assistant' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Assistant Files</h3>
                    <button
                      onClick={handleUpdateProjects}
                      disabled={isUpdatingProjects}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      {isUpdatingProjects ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Updating...
                        </>
                      ) : (
                        'Update with current projects'
                      )}
                    </button>
                  </div>
                  <KnowledgeBaseSection password={password} />
                </div>
              )}
              
              {activeTab === 'questions' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Assistant Questions</h3>
                  <form onSubmit={handleAddQuestion} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Question</label>
                      <input
                        type="text"
                        name="question"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        required
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      >
                        Add Question
                      </button>
                    </div>
                  </form>
                  
                  <div className="mt-8">
                    <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">Existing Questions</h4>
                    <div className="space-y-2">
                      {/* Questions will be loaded here */}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Voice Personality Settings</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                Choose how the assistant should sound when speaking to users.
              </p>
              <div className="flex flex-col gap-2">
                <label htmlFor="voiceStyle" className="text-sm font-medium">
                  Default Voice Style
                </label>
                <select
                  id="voiceStyle"
                  value={defaultVoiceStyle}
                  onChange={(e) => setDefaultVoiceStyle(e.target.value)}
                  className="w-full p-2 border rounded-md bg-white dark:bg-gray-800 
                           dark:border-gray-600 dark:text-white"
                >
                  <option value="energetic_concise">⚡ Energetic & Concise</option>
                  <option value="friendly">🤝 Friendly & Supportive</option>
                  <option value="calm">🧘 Calm & Clear</option>
                  <option value="neutral">🧠 Neutral/Natural Tone</option>
                </select>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}