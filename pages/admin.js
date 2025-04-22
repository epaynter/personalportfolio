import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('projects');
  const [projects, setProjects] = useState([]);
  const [categories, setCategories] = useState([]);
  const [hero, setHero] = useState({});
  const [about, setAbout] = useState({});
  const [contact, setContact] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState('');
  const [uploadStatus, setUploadStatus] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [updateStatus, setUpdateStatus] = useState('');

  useEffect(() => {
    fetchAllData();
    fetchUploadedFiles();
  }, []);

  const fetchAllData = async () => {
    try {
      const [projectsRes, categoriesRes, heroRes, aboutRes, contactRes] = await Promise.all([
        fetch('/api/projects'),
        fetch('/api/categories'),
        fetch('/api/hero'),
        fetch('/api/about'),
        fetch('/api/contact')
      ]);

      const [projectsData, categoriesData, heroData, aboutData, contactData] = await Promise.all([
        projectsRes.json(),
        categoriesRes.json(),
        heroRes.json(),
        aboutRes.json(),
        contactRes.json()
      ]);

      setProjects(projectsData);
      setCategories(categoriesData);
      setHero(heroData);
      setAbout(aboutData);
      setContact(contactData);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setIsLoading(false);
    }
  };

  const fetchUploadedFiles = async () => {
    try {
      const res = await fetch('/api/assistant-files');
      if (res.ok) {
        const data = await res.json();
        setUploadedFiles(data);
      }
    } catch (error) {
      console.error('Error fetching uploaded files:', error);
    }
  };

  const handleSaveAll = async () => {
    setSaveStatus('saving');
    try {
      // Save all changes in parallel
      await Promise.all([
        fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(projects)
        }),
        fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(categories)
        }),
        fetch('/api/hero', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(hero)
        }),
        fetch('/api/about', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(about)
        }),
        fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(contact)
        })
      ]);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (error) {
      console.error('Error saving changes:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Check file type
    const fileType = file.name.split('.').pop().toLowerCase();
    if (!['md', 'txt', 'json'].includes(fileType)) {
      setUploadStatus('error');
      alert('Only .md, .txt, and .json files are allowed');
      return;
    }

    setUploadStatus('uploading');
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload-assistant-file', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.ADMIN_PASSWORD}`,
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
    } catch (error) {
      console.error('Error uploading file:', error);
      setUploadStatus('error');
      setTimeout(() => setUploadStatus(''), 3000);
    }
  };

  const handleUpdateWithProjects = async () => {
    try {
      setUpdateStatus('updating');
      
      // Gather all project elements from the DOM
      const projectElements = document.querySelectorAll('[data-project]');
      const projects = Array.from(projectElements).map(element => {
        const projectData = JSON.parse(element.dataset.project);
        return {
          title: projectData.title,
          shortDescription: projectData.shortDescription,
          longDescription: projectData.longDescription,
          category: projectData.category,
          link: projectData.link
        };
      });

      // Send the projects data to the API
      const response = await fetch('/api/update-assistant-knowledge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_ADMIN_PASSWORD}`
        },
        body: JSON.stringify({ projects })
      });

      if (!response.ok) {
        throw new Error('Failed to update assistant knowledge');
      }

      setUpdateStatus('success');
      // Refresh the uploaded files list after successful update
      fetchUploadedFiles();
      setTimeout(() => setUpdateStatus(null), 3000);
    } catch (error) {
      console.error('Error updating assistant knowledge:', error);
      setUpdateStatus('error');
      setTimeout(() => setUpdateStatus(null), 3000);
    }
  };

  const tabs = [
    { id: 'projects', label: 'Projects' },
    { id: 'categories', label: 'Categories' },
    { id: 'hero', label: 'Hero Section' },
    { id: 'about', label: 'About Section' },
    { id: 'contact', label: 'Contact Section' },
    { id: 'assistant', label: 'Assistant Files' }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Panel</h1>
          <button
            onClick={handleSaveAll}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              saveStatus === 'saving'
                ? 'bg-gray-400 cursor-not-allowed'
                : saveStatus === 'saved'
                ? 'bg-green-500 hover:bg-green-600'
                : saveStatus === 'error'
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-primary-500 hover:bg-primary-600'
            } text-white`}
            disabled={saveStatus === 'saving'}
          >
            {saveStatus === 'saving'
              ? 'Saving...'
              : saveStatus === 'saved'
              ? 'Saved!'
              : saveStatus === 'error'
              ? 'Error Saving'
              : 'Save All Changes'}
          </button>
        </div>

        <div className="flex flex-col space-y-8">
          <div className="flex space-x-4 overflow-x-auto pb-4">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg transition-colors duration-200 ${
                  activeTab === tab.id
                    ? 'bg-primary-500 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            <div className="p-6">
              {activeTab === 'projects' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Projects</h2>
                  {projects.map((project, index) => (
                    <div
                      key={project._id || index}
                      className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-4"
                    >
                      <input
                        type="text"
                        value={project.title}
                        onChange={(e) => {
                          const newProjects = [...projects];
                          newProjects[index].title = e.target.value;
                          setProjects(newProjects);
                        }}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Project Title"
                      />
                      <textarea
                        value={project.shortDescription}
                        onChange={(e) => {
                          const newProjects = [...projects];
                          newProjects[index].shortDescription = e.target.value;
                          setProjects(newProjects);
                        }}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Short Description"
                        rows={2}
                      />
                      <textarea
                        value={project.longDescription}
                        onChange={(e) => {
                          const newProjects = [...projects];
                          newProjects[index].longDescription = e.target.value;
                          setProjects(newProjects);
                        }}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Long Description"
                        rows={4}
                      />
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'categories' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Categories</h2>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {categories.map((category, index) => (
                        <div
                          key={category._id || index}
                          className="flex items-center space-x-2"
                        >
                          <input
                            type="text"
                            value={category.name}
                            onChange={(e) => {
                              const newCategories = [...categories];
                              newCategories[index].name = e.target.value;
                              setCategories(newCategories);
                            }}
                            className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="Category Name"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'hero' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Hero Section</h2>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-4">
                    <input
                      type="text"
                      value={hero.title}
                      onChange={(e) => setHero({ ...hero, title: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Hero Title"
                    />
                    <textarea
                      value={hero.description}
                      onChange={(e) => setHero({ ...hero, description: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Hero Description"
                      rows={4}
                    />
                  </div>
                </div>
              )}

              {activeTab === 'about' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">About Section</h2>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-4">
                    <input
                      type="text"
                      value={about.title}
                      onChange={(e) => setAbout({ ...about, title: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="About Title"
                    />
                    <textarea
                      value={about.description}
                      onChange={(e) => setAbout({ ...about, description: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="About Description"
                      rows={4}
                    />
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        About Me Text
                      </label>
                      <textarea
                        value={about.aboutMeText || "A brief introduction"}
                        onChange={(e) => setAbout({ ...about, aboutMeText: e.target.value })}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="About Me Text"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'contact' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Contact Section</h2>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-4">
                    <input
                      type="text"
                      value={contact.title}
                      onChange={(e) => setContact({ ...contact, title: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Contact Title"
                    />
                    <textarea
                      value={contact.description}
                      onChange={(e) => setContact({ ...contact, description: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Contact Description"
                      rows={4}
                    />
                  </div>
                </div>
              )}

              {activeTab === 'assistant' && (
                <div className="space-y-8">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Assistant Knowledge Base</h2>
                    <button
                      onClick={handleUpdateWithProjects}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        updateStatus === 'updating'
                          ? 'bg-blue-400 cursor-not-allowed'
                          : updateStatus === 'success'
                          ? 'bg-green-500 hover:bg-green-600'
                          : updateStatus === 'error'
                          ? 'bg-red-500 hover:bg-red-600'
                          : 'bg-primary-500 hover:bg-primary-600'
                      } text-white`}
                      disabled={updateStatus === 'updating'}
                    >
                      {updateStatus === 'updating'
                        ? 'Updating...'
                        : updateStatus === 'success'
                        ? 'Updated!'
                        : updateStatus === 'error'
                        ? 'Error Updating'
                        : 'Update with Current Projects'}
                    </button>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Upload Document</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Upload .md, .txt, or .json files to enhance the assistant's knowledge base.
                    </p>
                    <div className="space-y-4">
                      <input
                        type="file"
                        accept=".md,.txt,.json"
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

                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Knowledge Base Documents</h3>
                    <div className="space-y-4">
                      {uploadedFiles.map((file) => (
                        <div
                          key={file._id}
                          className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                        >
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{file.filename}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {new Date(file.uploadedAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className="px-3 py-1 text-sm rounded-full bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200">
                              {file.filetype}
                            </span>
                            {file.isProjectsData && (
                              <span className="px-3 py-1 text-sm rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                Projects Data
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                      {uploadedFiles.length === 0 && (
                        <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                          No documents uploaded yet
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 