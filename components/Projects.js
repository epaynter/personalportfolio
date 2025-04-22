import { useEffect, useState } from 'react';
import { gsap } from 'gsap';
import ProjectCarousel from './ProjectCarousel';

export default function Projects({ projectsData, onUpdateProjects }) {
  const [projects, setProjects] = useState(projectsData.projects || []);

  useEffect(() => {
    // Stagger the animations
    gsap.fromTo(
      '.projects-content',
      { 
        opacity: 0, 
        y: 30 
      },
      { 
        opacity: 1, 
        y: 0,
        duration: 1,
        ease: 'power3.out'
      }
    );
  }, []);

  const handleReorder = (newOrder) => {
    setProjects(newOrder);
    if (onUpdateProjects) {
      onUpdateProjects({
        ...projectsData,
        projects: newOrder
      });
    }
  };

  return (
    <section id="projects" className="relative py-24 bg-background">
      {/* Background elements */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[url('/textures/noise.png')] opacity-[0.15] mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-primary-50/30 via-transparent to-background"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-[1400px] mx-auto px-6 md:px-12">
        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-12 md:col-start-3 md:col-span-8">
            <div className="projects-content space-y-12">
              <div className="text-center">
                <h2 className="text-heading-2 font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-primary-400">
                  {projectsData.title || "Featured Projects"}
                </h2>
                <p className="mt-4 text-body text-gray-600">
                  {projectsData.description || "Here are some of my recent projects that showcase my skills and experience."}
                </p>
              </div>

              <ProjectCarousel 
                projects={projects} 
                onReorder={handleReorder}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
} 