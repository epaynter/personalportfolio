import { useState, useEffect } from 'react';

const AdminModal = ({ isOpen, onClose, onSave, project }) => {
  const [title, setTitle] = useState(project?.title || '');
  const [shortDescription, setShortDescription] = useState(project?.shortDescription || project?.description || '');
  const [longDescription, setLongDescription] = useState(project?.longDescription || project?.description || '');
  const [content, setContent] = useState(project?.content || []);
  const [selectedContentIndex, setSelectedContentIndex] = useState(0);
  const [mainImage, setMainImage] = useState(project?.mainImage || '');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (project) {
      setTitle(project.title);
      setShortDescription(project.shortDescription || project.description || '');
      setLongDescription(project.longDescription || project.description || '');
      setContent(project.content || []);
      setMainImage(project.mainImage || '');
      setSelectedContentIndex(0);
    }
  }, [project]);

  const handleProjectImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setIsLoading(true);
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const base64data = reader.result;
        const response = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ file: base64data }),
        });

        if (!response.ok) {
          throw new Error('Failed to upload image');
        }

        const data = await response.json();
        const newContent = [...content, { url: data.url, type: 'image' }];
        setContent(newContent);
        setMainImage(data.url);
        setSelectedContentIndex(newContent.length - 1);
      };
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContentSelection = (index) => {
    setSelectedContentIndex(index);
    setMainImage(content[index].url);
  };

  const handleRemoveContent = (index) => {
    const newContent = content.filter((_, i) => i !== index);
    setContent(newContent);
    if (selectedContentIndex === index) {
      setSelectedContentIndex(Math.max(0, index - 1));
      setMainImage(newContent[Math.max(0, index - 1)]?.url || '');
    } else if (selectedContentIndex > index) {
      setSelectedContentIndex(selectedContentIndex - 1);
    }
  };

  const handleSave = () => {
    onSave({
      title,
      shortDescription,
      longDescription,
      description: shortDescription,
      content,
      mainImage,
    });
    onClose();
  };

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center ${isOpen ? 'block' : 'hidden'}`}>
      <div className="bg-white p-6 rounded-lg w-full max-w-2xl">
        <h2 className="text-2xl font-bold mb-4">Edit Project</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Short Description (for card view)</label>
            <textarea
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              rows={2}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Long Description (for modal view)</label>
            <textarea
              value={longDescription}
              onChange={(e) => setLongDescription(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              rows={4}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Project Images</label>
            <div className="mt-2 grid grid-cols-3 gap-4">
              {content.map((item, index) => (
                <div key={index} className="relative">
                  <img
                    src={item.url}
                    alt={`Content ${index + 1}`}
                    className={`w-full h-32 object-cover rounded-lg ${
                      selectedContentIndex === index ? 'ring-2 ring-indigo-500' : ''
                    }`}
                  />
                  <div className="absolute top-2 right-2 space-x-2">
                    <button
                      onClick={() => handleContentSelection(index)}
                      className="bg-indigo-500 text-white p-1 rounded-full hover:bg-indigo-600"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleRemoveContent(index)}
                      className="bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
              <label className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex items-center justify-center cursor-pointer hover:border-indigo-500">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProjectImageChange}
                  className="hidden"
                />
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </label>
            </div>
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Display Content
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {project.content.map((content, index) => (
                <div
                  key={index}
                  className={`relative aspect-video rounded-lg overflow-hidden cursor-pointer border-2 ${
                    index === selectedContentIndex
                      ? 'border-primary-500'
                      : 'border-transparent'
                  }`}
                  onClick={() => setSelectedContentIndex(index)}
                >
                  {content.type === 'image' ? (
                    <img
                      src={content.url}
                      alt={`Content ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  ) : content.type === 'video' ? (
                    <video
                      src={content.url}
                      className="w-full h-full object-cover"
                      muted
                      loop
                      playsInline
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  {index === selectedContentIndex && (
                    <div className="absolute inset-0 bg-primary-500/20 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Select which content to display on the project card
            </p>
          </div>
        </div>
        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminModal; 