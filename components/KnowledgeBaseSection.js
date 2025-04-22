import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Editor } from '@monaco-editor/react';
import { EyeIcon } from '@heroicons/react/24/outline';

export default function KnowledgeBaseSection({ password }) {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [projectData, setProjectData] = useState([]);
  const [uploadStatus, setUploadStatus] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileDescription, setFileDescription] = useState('');
  const [showDescriptionInput, setShowDescriptionInput] = useState(false);
  const [isCreatingNewFile, setIsCreatingNewFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileContent, setNewFileContent] = useState('');
  const [newFileExtension, setNewFileExtension] = useState('md');
  const [editingFile, setEditingFile] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [updateStatus, setUpdateStatus] = useState('idle');
  const [loadedFileIds, setLoadedFileIds] = useState([]);
  const [previewFile, setPreviewFile] = useState(null);
  const [previewContent, setPreviewContent] = useState('');
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (password) {
      fetchUploadedFiles();
      fetchProjectData();
      fetchLoadedFileIds();
    }
  }, [password]);

  const fetchUploadedFiles = async () => {
    try {
      const res = await fetch('/api/assistant-files', {
        headers: {
          'Authorization': `Bearer ${password}`,
        },
      });
      if (!res.ok) throw new Error('Failed to fetch uploaded files');
      const data = await res.json();
      setUploadedFiles(data);
    } catch (error) {
      console.error('Error fetching uploaded files:', error);
    }
  };

  const fetchProjectData = async () => {
    try {
      const res = await fetch('/api/project-data', {
        headers: {
          'Authorization': `Bearer ${password}`,
        },
      });
      if (!res.ok) throw new Error('Failed to fetch project data');
      const data = await res.json();
      setProjectData(data);
    } catch (error) {
      console.error('Error fetching project data:', error);
    }
  };

  const fetchLoadedFileIds = async () => {
    try {
      const res = await fetch('/api/assistant-files/loaded', {
        headers: {
          'Authorization': `Bearer ${password}`,
        },
      });
      if (!res.ok) throw new Error('Failed to fetch loaded files');
      const data = await res.json();
      setLoadedFileIds(data.map(file => file._id));
    } catch (error) {
      console.error('Error fetching loaded files:', error);
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
          'Authorization': `Bearer ${password}`,
        },
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');

      const data = await res.json();
      setUploadStatus('success');
      
      // Update the files list immediately
      setUploadedFiles(prevFiles => [data, ...prevFiles]);
      
      // Check if the file is loaded in the assistant's knowledge base
      if (data.openaiFileId) {
        setLoadedFileIds(prevIds => [...prevIds, data._id]);
      }
      
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

  const handleDeleteFile = async (fileId) => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
      const response = await fetch(`/api/assistant-files/${fileId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${password}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete file');
      
      // Update the files list immediately
      setUploadedFiles(prevFiles => prevFiles.filter(file => file._id !== fileId));
      
      // Remove from loaded files if it was loaded
      setLoadedFileIds(prevIds => prevIds.filter(id => id !== fileId));
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };

  const handleEditFile = async (file) => {
    try {
      const response = await fetch(`/api/assistant-files/${file.id}`, {
        headers: {
          'Authorization': `Bearer ${password}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch file content');

      const data = await response.json();
      setEditingFile({
        id: file.id,
        content: data.content,
        filename: file.filename,
        extension: file.filename.split('.').pop()
      });
      setEditContent(data.content);
    } catch (error) {
      console.error('Error fetching file content:', error);
    }
  };

  const handleSaveEdit = async () => {
    try {
      const response = await fetch('/api/update-assistant-file', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${password}`,
        },
        body: JSON.stringify({
          fileId: editingFile.id,
          content: editContent
        }),
      });

      if (!response.ok) throw new Error('Failed to save changes');

      await fetchUploadedFiles();
      setEditingFile(null);
      setEditContent('');
    } catch (error) {
      console.error('Error saving file:', error);
    }
  };

  const handleCreateNewFile = () => {
    setIsCreatingNewFile(true);
    setNewFileName('');
    setNewFileContent('');
    setNewFileExtension('md');
  };

  const handleSaveNewFile = async () => {
    if (!newFileName.trim()) return;

    setUploadStatus('uploading');
    
    try {
      const file = new File(
        [newFileContent], 
        `${newFileName}.${newFileExtension}`, 
        { type: 'text/plain' }
      );
      
      await uploadFile(file);
      setIsCreatingNewFile(false);
      setNewFileName('');
      setNewFileContent('');
      setNewFileExtension('md');
    } catch (error) {
      console.error('Error creating file:', error);
      setUploadStatus('error');
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes || isNaN(bytes)) return '0 B';
    
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  const handlePreviewFile = async (file) => {
    setIsLoadingPreview(true);
    setPreviewFile(file);
    
    try {
      console.log(`Fetching content for file: ${file._id}`);
      const response = await fetch(`/api/assistant-files/${file._id}/content`, {
        headers: {
          'Authorization': `Bearer ${password}`,
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch file content');
      }
      
      const data = await response.json();
      console.log(`Received file content: ${data.content ? data.content.substring(0, 50) + '...' : 'empty'}`);
      
      // Set the preview content
      setPreviewContent(data.content || 'No content available');
      
      // Store additional information about the preview
      setPreviewFile(prev => ({
        ...prev,
        truncated: data.truncated,
        totalLines: data.totalLines,
        fileType: data.fileType,
        error: data.error
      }));
    } catch (error) {
      console.error('Error fetching file content:', error);
      setPreviewContent(`Error loading file content: ${error.message}`);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const closePreview = () => {
    setPreviewFile(null);
    setPreviewContent('');
  };

  const handleDownloadFile = async (file) => {
    try {
      // Create a link element
      const link = document.createElement('a');
      
      // Set the href to the file URL
      // This assumes there's an API endpoint to download the file
      // You may need to adjust this based on your actual file storage setup
      link.href = `/api/assistant-files/${file._id}/download`;
      
      // Set the download attribute with the filename
      link.download = file.filename;
      
      // Append to the document
      document.body.appendChild(link);
      
      // Trigger the download
      link.click();
      
      // Clean up
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Failed to download file. Please try again.');
    }
  };

  const handleExportAll = async () => {
    setIsExporting(true);
    try {
      const response = await fetch('/api/assistant-files/export', {
        headers: {
          'Authorization': `Bearer ${password}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to export files');
      }

      // Create a blob from the response
      const blob = await response.blob();
      
      // Create a link element
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = 'assistant-files.zip';
      
      // Append to the document
      document.body.appendChild(link);
      
      // Trigger the download
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error('Error exporting files:', error);
      alert('Failed to export files: ' + error.message);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Knowledge Base</h3>
        <div className="flex space-x-2">
          <button
            onClick={handleCreateNewFile}
            className="px-4 py-2 rounded-lg font-medium transition-colors bg-green-500 hover:bg-green-600 text-white"
          >
            Create New File
          </button>
          <button
            onClick={handleExportAll}
            disabled={isExporting}
            className="px-4 py-2 rounded-lg font-medium transition-colors bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isExporting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Exporting...
              </>
            ) : (
              'Export All'
            )}
          </button>
        </div>
      </div>

      {/* Upload Section */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
        <h4 className="text-md font-medium mb-2 text-gray-800 dark:text-gray-200">Upload Document</h4>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Upload files to enhance the assistant's knowledge base.
        </p>
        <div className="space-y-4">
          <input
            type="file"
            accept=".md,.txt,.json,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
            onChange={handleFileUpload}
            className="block w-full text-sm text-gray-500 dark:text-gray-400
              file:mr-4 file:py-2 file:px-4
              file:rounded-lg file:border-0
              file:text-sm file:font-semibold
              file:bg-primary-50 file:text-primary-700
              hover:file:bg-primary-100
              dark:file:bg-primary-900 dark:file:text-primary-300"
          />
          {uploadStatus && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`text-sm ${
                uploadStatus === 'uploading' ? 'text-blue-500' :
                uploadStatus === 'success' ? 'text-green-500' :
                'text-red-500'
              }`}
            >
              {uploadStatus === 'uploading' ? 'Uploading...' :
               uploadStatus === 'success' ? 'File uploaded successfully!' :
               'Error uploading file'}
            </motion.div>
          )}
        </div>
      </div>

      {/* Uploaded Files Section */}
      <div>
        <h4 className="text-md font-medium mb-2 text-gray-800 dark:text-gray-200">Uploaded Files</h4>
        <div className="space-y-2">
          {uploadedFiles.map((file) => (
            <div key={file._id} className="flex items-center justify-between p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center">
                  <h3 
                    className="font-semibold text-gray-900 dark:text-white cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                    onClick={() => handlePreviewFile(file)}
                  >
                    {file.filename}
                  </h3>
                  <button 
                    onClick={() => handlePreviewFile(file)}
                    className="ml-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                    title="Preview file"
                  >
                    <EyeIcon className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                  <span>Uploaded: {new Date(file.uploadDate).toLocaleDateString()}</span>
                  <span>Size: {formatFileSize(file.size)}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    loadedFileIds.includes(file._id) 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                  }`}>
                    {loadedFileIds.includes(file._id) ? '✅ Active' : '❌ Not Loaded'}
                  </span>
                </div>
                {file.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 italic">"{file.description}"</p>
                )}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleDeleteFile(file._id)}
                  className="px-3 py-1 text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                >
                  Remove
                </button>
                <button
                  onClick={() => handleEditFile(file)}
                  className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Edit
                </button>
              </div>
            </div>
          ))}
          {uploadedFiles.length === 0 && (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              No files uploaded yet
            </p>
          )}
        </div>
      </div>

      {/* Project Data Section */}
      <div>
        <h4 className="text-md font-medium mb-2 text-gray-800 dark:text-gray-200">Indexed Project Content</h4>
        <div className="space-y-2">
          {projectData.map((project) => (
            <div key={project._id} className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <h3 className="font-semibold text-gray-900 dark:text-white">{project.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {project.description}
              </p>
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Last updated: {new Date(project.updatedAt).toLocaleDateString()}
              </div>
            </div>
          ))}
          {projectData.length === 0 && (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              No project data indexed yet
            </p>
          )}
        </div>
      </div>

      {/* File Creation Modal */}
      {isCreatingNewFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-4xl h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Create New File</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsCreatingNewFile(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveNewFile}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Save
                </button>
              </div>
            </div>
            <div className="mb-4 flex space-x-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  File Name
                </label>
                <input
                  type="text"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  placeholder="Enter file name (without extension)"
                  className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div className="w-32">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Extension
                </label>
                <select
                  value={newFileExtension}
                  onChange={(e) => setNewFileExtension(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="md">.md</option>
                  <option value="txt">.txt</option>
                  <option value="json">.json</option>
                </select>
              </div>
            </div>
            <div className="flex-grow relative min-h-0">
              <Editor
                height="100%"
                defaultLanguage={newFileExtension}
                theme="vs-dark"
                value={newFileContent}
                onChange={setNewFileContent}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: 'on',
                  roundedSelection: false,
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  wordWrap: 'on'
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* File Edit Modal */}
      {editingFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-4xl h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Edit {editingFile.filename}</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setEditingFile(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Save
                </button>
              </div>
            </div>
            <div className="flex-grow relative min-h-0">
              <Editor
                height="100%"
                defaultLanguage={editingFile.extension}
                theme="vs-dark"
                value={editContent}
                onChange={setEditContent}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: 'on',
                  roundedSelection: false,
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  wordWrap: 'on'
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* File Description Modal */}
      {showDescriptionInput && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">Add Description</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Please provide a description for this file. This will help the assistant understand the content.
            </p>
            <textarea
              value={fileDescription}
              onChange={(e) => setFileDescription(e.target.value)}
              placeholder="Describe the file content..."
              className="w-full p-2 border rounded-lg mb-4 dark:bg-gray-700 dark:text-white"
              rows={4}
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowDescriptionInput(false);
                  setSelectedFile(null);
                  setFileDescription('');
                }}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleDescriptionSubmit}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Upload
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {previewFile.filename}
              </h3>
              <button
                onClick={closePreview}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Close
              </button>
            </div>
            <div className="p-4 overflow-auto max-h-[calc(90vh-8rem)]">
              {isLoadingPreview ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {previewFile.error ? (
                    <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                      <h4 className="text-red-800 dark:text-red-300 font-medium mb-2">Error</h4>
                      <p className="text-red-700 dark:text-red-400">{previewFile.error}</p>
                    </div>
                  ) : null}
                  <Editor
                    height="500px"
                    defaultLanguage={previewFile.fileType || 'plaintext'}
                    value={previewContent}
                    options={{
                      readOnly: true,
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      lineNumbers: 'on',
                      wordWrap: 'on',
                    }}
                  />
                  {previewFile.truncated && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                      Showing first 200 lines of {previewFile.totalLines} total lines
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 