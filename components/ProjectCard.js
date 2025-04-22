// File: components/ProjectCard.js
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TheaterModal from './TheaterModal';

export default function ProjectCard({ project }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [currentContentIndex, setCurrentContentIndex] = useState(project.selectedContentIndex || 0);

  // Clean HTML content by removing empty paragraphs
  const cleanHtml = (html) => {
    if (!html) return '';
    // Remove empty paragraphs
    return html.replace(/<p><br><\/p>/g, '');
  };

  const projectData = {
    title: project.title,
    shortDescription: project.shortDescription,
    longDescription: project.longDescription,
    category: project.category,
    link: project.link
  };

  // Get tags from project data or use default tags based on category
  const getTags = () => {
    if (project.tags && Array.isArray(project.tags)) {
      return project.tags;
    }
    
    // Default tags based on category
    const defaultTags = {
      'Crypto': ['Solana', 'Web3', 'Blockchain'],
      'Misc. Coding': ['React', 'Node.js', 'TypeScript'],
      'Data Viz': ['D3.js', 'Python', 'Data Analysis'],
    };
    
    return defaultTags[project.category] || [project.category];
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.7,
        ease: "easeOut"
      }
    },
    hover: {
      y: -8,
      transition: {
        duration: 0.3,
        ease: "easeInOut"
      }
    }
  };

  const imageVariants = {
    hover: {
      scale: 1.05,
      transition: {
        duration: 0.4,
        ease: "easeOut"
      }
    }
  };

  const handlePrevContent = () => {
    setCurrentContentIndex((prev) => 
      prev === 0 ? project.content.length - 1 : prev - 1
    );
  };

  const handleNextContent = () => {
    setCurrentContentIndex((prev) => 
      prev === project.content.length - 1 ? 0 : prev + 1
    );
  };

  const getCurrentContent = () => {
    if (!project.content || project.content.length === 0) {
      if (!project.image) {
        return { 
          type: 'placeholder',
          url: null
        };
      }
      return { url: project.image, type: 'image' };
    }
    return project.content[currentContentIndex];
  };

  const currentContent = getCurrentContent();

  return (
    <div 
      className="project-card"
      data-project={JSON.stringify(projectData)}
    >
      <motion.div
        variants={cardVariants}
        initial="hidden"
        whileInView="visible"
        whileHover="hover"
        viewport={{ once: true, margin: "-50px" }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        className="group bg-white/5 backdrop-blur-sm dark:bg-zinc-800 rounded-2xl overflow-hidden border border-white/10 hover:border-primary-500/30 transition-all duration-300 h-full flex flex-col"
      >
        <div className="relative aspect-video overflow-hidden">
          {currentContent.type === 'image' ? (
            <motion.img
              variants={imageVariants}
              animate={isHovered ? "hover" : ""}
              src={currentContent.url}
              alt={project.title}
              className="w-full h-full object-cover"
            />
          ) : currentContent.type === 'video' ? (
            <motion.video
              variants={imageVariants}
              animate={isHovered ? "hover" : ""}
              src={currentContent.url}
              className="w-full h-full object-cover"
              muted
              loop
              playsInline
            />
          ) : currentContent.type === 'pdf' ? (
            <motion.div
              variants={imageVariants}
              animate={isHovered ? "hover" : ""}
              className="w-full h-full flex flex-col items-center justify-center bg-gray-100 dark:bg-zinc-700 p-4"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <span className="text-sm text-gray-600 dark:text-zinc-300 text-center truncate max-w-full">
                {currentContent.url.split('/').pop()}
              </span>
            </motion.div>
          ) : currentContent.type === 'placeholder' ? (
            <motion.div
              variants={imageVariants}
              animate={isHovered ? "hover" : ""}
              className="w-full h-full flex flex-col items-center justify-center bg-gray-100 dark:bg-zinc-700 p-4"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-primary-600 dark:text-primary-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-sm text-gray-600 dark:text-zinc-300 text-center">
                Images coming soon
              </span>
            </motion.div>
          ) : (
            <motion.div
              variants={imageVariants}
              animate={isHovered ? "hover" : ""}
              className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-zinc-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 dark:text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </motion.div>
          )}
          
          {/* Hover overlay with buttons */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="absolute top-4 right-4">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsTheaterMode(true);
                }}
                className="p-2 bg-white/10 backdrop-blur-sm rounded-lg hover:bg-white/20 transition-colors"
                title="Expand to full screen"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              </button>
            </div>
            <div className="absolute bottom-4 left-4 right-4 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
              <button
                onClick={() => setIsModalOpen(true)}
                className="w-full px-4 py-2 bg-white/10 backdrop-blur-sm text-white rounded-lg hover:bg-zinc-700 transition-colors"
              >
                View Project
              </button>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-zinc-100 mb-2">
            {project.title}
          </h3>
          <div className="prose prose-sm dark:prose-invert max-w-none text-gray-600 dark:text-gray-400 [&>p]:mb-2 [&>p:last-child]:mb-0">
            <div dangerouslySetInnerHTML={{ __html: cleanHtml(project.shortDescription) }} />
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            {getTags().map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1 text-sm font-medium bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-300 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Regular modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-40"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="bg-white dark:bg-zinc-800 rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="relative aspect-video">
                {currentContent.type === 'image' ? (
                  <img
                    src={currentContent.url}
                    alt={project.title}
                    className="w-full h-full object-cover"
                  />
                ) : currentContent.type === 'video' ? (
                  <video
                    src={currentContent.url}
                    className="w-full h-full object-cover"
                    controls
                    autoPlay
                  />
                ) : currentContent.type === 'pdf' ? (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 dark:bg-zinc-700 p-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <span className="text-base text-gray-600 dark:text-zinc-300 text-center mb-4">
                      {currentContent.url.split('/').pop()}
                    </span>
                    <a
                      href={currentContent.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                      View PDF
                    </a>
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-zinc-700">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 dark:text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                
                {/* Theater Mode Button */}
                <div className="absolute top-4 right-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsTheaterMode(true);
                    }}
                    className="p-2 bg-black/50 backdrop-blur-sm rounded-lg hover:bg-black/70 transition-colors"
                    title="Expand to full screen"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                  </button>
                </div>
                
                {/* Carousel Navigation */}
                {project.content && project.content.length > 1 && (
                  <>
                    <button
                      onClick={handlePrevContent}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-zinc-700 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={handleNextContent}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-zinc-700 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </>
                )}
              </div>
              
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-zinc-100 mb-4">
                  {project.title}
                </h2>
                <div className="project-content text-gray-600 dark:text-zinc-300 mb-6">
                  <div dangerouslySetInnerHTML={{ __html: cleanHtml(project.longDescription || project.shortDescription || "No description available") }} />
                </div>
                <div className="flex flex-wrap gap-2 mb-6">
                  {getTags().map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 text-sm font-medium bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-300 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                {project.link && (
                  <a
                    href={project.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    View Project
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Theater mode modal */}
      <TheaterModal
        isOpen={isTheaterMode}
        onClose={() => setIsTheaterMode(false)}
        project={project}
        currentContent={currentContent}
      />
    </div>
  );
}