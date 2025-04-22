const ProjectModal = ({ project, onClose }) => {
  const projectData = {
    title: project.title,
    shortDescription: project.shortDescription,
    longDescription: project.longDescription,
    category: project.category,
    link: project.link
  };

  return (
    <div 
      className="project-modal"
      data-project={JSON.stringify(projectData)}
    >
      // ... existing code ...
    </div>
  );
}; 