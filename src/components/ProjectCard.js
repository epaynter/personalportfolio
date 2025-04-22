import React, { useState } from 'react';

const ProjectCard = ({ project }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [currentContentIndex, setCurrentContentIndex] = useState(project.selectedContentIndex || 0);

  // Debug the project data
  console.log('Project data:', project);
  console.log('Description:', project.description);
  console.log('Short description:', project.shortDescription);
  console.log('Long description:', project.longDescription);

  const handlePrevContent = () => {
    setCurrentContentIndex((prev) => (prev === 0 ? project.content.length - 1 : prev - 1));
  };

  const handleNextContent = () => {
    setCurrentContentIndex((prev) => (prev === project.content.length - 1 ? 0 : prev + 1));
  };

  const getCurrentContent = () => {
    return project.content[currentContentIndex];
  };

  // Get the appropriate description to display
  const getCardDescription = () => {
    // Try to get the short description, fall back to long description, then to a default
    return project.shortDescription || project.longDescription || "No description available";
  };

  const getModalDescription = () => {
    // Try to get the long description, fall back to short description, then to a default
    return project.longDescription || project.shortDescription || "No description available";
  };

  const projectData = {
    title: project.title,
    shortDescription: project.shortDescription,
    longDescription: project.longDescription,
    category: project.category,
    link: project.link
  };

  return (
    <div
      className="relative group project-card"
      data-project={JSON.stringify(projectData)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative aspect-video rounded-lg overflow-hidden">
        {getCurrentContent().type === 'image' ? (
          <img
            src={getCurrentContent().url}
            alt={project.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <video
            src={getCurrentContent().url}
            className="w-full h-full object-cover"
            muted
            loop
            playsInline
            autoPlay={isHovered}
          />
        )}
        <div className="absolute inset-0 bg-black/50 transition-opacity duration-300 group-hover:opacity-75" />
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-white">
          <h3 className="text-xl font-bold mb-2">{project.title}</h3>
          <p className="text-sm text-center mb-4">{getCardDescription()}</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors duration-300"
          >
            View Details
          </button>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75">
          <div className="relative w-full max-w-4xl bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="relative aspect-video">
              {project.content[currentContentIndex].type === 'image' ? (
                <img
                  src={project.content[currentContentIndex].url}
                  alt={project.title}
                  className="w-full h-full object-contain"
                />
              ) : (
                <video
                  src={project.content[currentContentIndex].url}
                  className="w-full h-full object-contain"
                  controls
                  autoPlay
                />
              )}

              {/* Navigation Arrows */}
              {project.content.length > 1 && (
                <>
                  <button
                    onClick={handlePrevContent}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/75 transition-colors duration-300"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={handleNextContent}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/75 transition-colors duration-300"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}
            </div>

            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">{project.title}</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">{getModalDescription()}</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {project.technologies.map((tech, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm"
                  >
                    {tech}
                  </span>
                ))}
              </div>
              <div className="flex gap-4">
                {project.githubUrl && (
                  <a
                    href={project.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary-500 hover:text-primary-600"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                    GitHub
                  </a>
                )}
                {project.liveUrl && (
                  <a
                    href={project.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary-500 hover:text-primary-600"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Live Site
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectCard; 