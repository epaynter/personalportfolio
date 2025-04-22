import { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { Draggable } from 'gsap/Draggable';
import { Sortable } from 'gsap/Sortable';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register Draggable and Sortable plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(Draggable, Sortable, ScrollTrigger);
}

export default function ProjectCarousel({ projects, onReorder, isAdmin = false }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const containerRef = useRef(null);
  const trackRef = useRef(null);
  const draggableInstance = useRef(null);
  const sortableInstance = useRef(null);

  // Check if we're on mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || isMobile) return;

    // Initialize draggable for carousel navigation
    draggableInstance.current = Draggable.create(trackRef.current, {
      type: 'x',
      bounds: containerRef.current,
      inertia: true,
      onDragStart: () => setIsDragging(true),
      onDragEnd: () => {
        setIsDragging(false);
        snapToNearestCard();
      },
      onDrag: function() {
        const progress = -this.x / ((projects.length - 1) * 100);
        setCurrentIndex(Math.round(progress * (projects.length - 1)));
      }
    })[0];

    // Initialize sortable for project reordering if in admin mode
    if (isAdmin) {
      sortableInstance.current = Sortable.create(trackRef.current, {
        draggable: '.project-card',
        handle: '.drag-handle',
        onDragStart: () => {
          setIsReordering(true);
          setIsDragging(true);
        },
        onDragEnd: (e) => {
          setIsReordering(false);
          setIsDragging(false);
          if (onReorder) {
            const newOrder = Array.from(trackRef.current.children).map(
              (el) => projects.find(p => p.id === el.dataset.projectId)
            );
            onReorder(newOrder);
          }
        }
      });
    }

    return () => {
      if (draggableInstance.current) {
        draggableInstance.current.kill();
      }
      if (isAdmin && sortableInstance.current) {
        sortableInstance.current.kill();
      }
    };
  }, [isMobile, projects, onReorder, isAdmin]);

  const snapToNearestCard = () => {
    if (!trackRef.current || !containerRef.current) return;

    const trackWidth = trackRef.current.scrollWidth;
    const containerWidth = containerRef.current.offsetWidth;
    const maxScroll = trackWidth - containerWidth;
    const currentScroll = -trackRef.current._gsap.x;
    const cardWidth = trackWidth / projects.length;
    
    const nearestIndex = Math.round(currentScroll / cardWidth);
    const newIndex = Math.max(0, Math.min(nearestIndex, projects.length - 1));
    
    setCurrentIndex(newIndex);
    
    gsap.to(trackRef.current, {
      x: -newIndex * cardWidth,
      duration: 0.5,
      ease: 'power2.out'
    });
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < projects.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleCardClick = (e) => {
    if (isDragging) {
      e.preventDefault();
    }
  };

  return (
    <div className="relative w-full">
      {/* Reorder toggle button */}
      <button
        onClick={() => setIsReordering(!isReordering)}
        className={`absolute top-0 right-0 z-20 p-2 rounded-lg ${
          isReordering 
            ? 'bg-primary-600 text-white' 
            : 'bg-white/80 backdrop-blur-sm text-gray-600 hover:bg-white'
        } shadow-soft hover:shadow-medium transition-all`}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
        </svg>
      </button>

      {/* Navigation arrows - Desktop only */}
      <div className="hidden md:block">
        <button
          onClick={handlePrev}
          className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12 z-10 p-2 rounded-full bg-white/80 backdrop-blur-sm shadow-soft hover:bg-white transition-colors ${
            currentIndex === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-medium'
          }`}
          disabled={currentIndex === 0}
          aria-label="Previous project"
        >
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          onClick={handleNext}
          className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 z-10 p-2 rounded-full bg-white/80 backdrop-blur-sm shadow-soft hover:bg-white transition-colors ${
            currentIndex === projects.length - 1 ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-medium'
          }`}
          disabled={currentIndex === projects.length - 1}
          aria-label="Next project"
        >
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Carousel container */}
      <div 
        ref={containerRef}
        className="overflow-hidden"
      >
        {/* Track */}
        <div 
          ref={trackRef}
          className={`flex ${isMobile ? 'flex-col space-y-8' : 'md:flex-row gap-8'} ${
            isReordering ? 'cursor-move' : 'cursor-grab active:cursor-grabbing'
          }`}
          style={{ touchAction: 'pan-y pinch-zoom' }}
        >
          {projects.map((project, index) => (
            <div
              key={project.id}
              data-project-id={project.id}
              className={`project-card flex-shrink-0 w-full ${isMobile ? '' : 'md:w-[400px]'} transition-all duration-300 ${
                !isMobile && index === currentIndex ? 'scale-100' : 'scale-95'
              } ${isReordering ? 'hover:ring-2 hover:ring-primary-500' : ''}`}
              onClick={handleCardClick}
            >
              <div className="group bg-white rounded-xl shadow-soft overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-105">
                {/* Drag handle - only visible in reorder mode */}
                {isReordering && (
                  <div className="drag-handle absolute top-2 left-2 z-10 p-2 bg-white/80 backdrop-blur-sm rounded-lg cursor-move shadow-soft">
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                    </svg>
                  </div>
                )}

                <div className="relative aspect-video overflow-hidden">
                  <img
                    src={project.image}
                    alt={project.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
                    <h3 className="text-heading-3 font-bold text-white mb-2">{project.title}</h3>
                    
                    {/* Project Metadata */}
                    <div className="space-y-2 mb-3">
                      {/* Tags */}
                      {project.tags && project.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {project.tags.map((tag, i) => (
                            <span key={i} className="text-xs text-white/80 bg-white/20 px-2 py-0.5 rounded-full">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      {/* Role */}
                      {project.role && (
                        <div className="flex items-center gap-1.5">
                          <svg className="w-4 h-4 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span className="text-sm text-white/80">{project.role}</span>
                        </div>
                      )}
                      
                      {/* Tools */}
                      {project.tools && project.tools.length > 0 && (
                        <div className="flex items-center gap-1.5">
                          <svg className="w-4 h-4 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                          </svg>
                          <div className="flex flex-wrap gap-1">
                            {project.tools.map((tool, i) => (
                              <span key={i} className="text-xs text-white/80">
                                {tool}{i < project.tools.length - 1 ? ',' : ''}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <p className="text-white/90 text-sm">{project.description}</p>
                  </div>
                </div>
                <div className="p-4 md:p-6">
                  <div className="flex flex-wrap gap-2 mb-4">
                    {project.technologies.map((tech, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 text-sm bg-primary-50 text-primary-600 rounded-full"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-4">
                    {project.github && (
                      <a
                        href={project.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-600 hover:text-primary-600 transition-colors"
                      >
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                        </svg>
                      </a>
                    )}
                    {project.demo && (
                      <a
                        href={project.demo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-600 hover:text-primary-600 transition-colors"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile pagination dots */}
      <div className="md:hidden flex justify-center gap-2 mt-6">
        {projects.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-colors ${
              index === currentIndex ? 'bg-primary-600' : 'bg-gray-300'
            }`}
            aria-label={`Go to project ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
} 