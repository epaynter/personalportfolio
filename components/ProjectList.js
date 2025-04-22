const ProjectList = ({ projects }) => {
  const projectData = projects.map(project => ({
    title: project.title,
    shortDescription: project.shortDescription,
    longDescription: project.longDescription,
    category: project.category,
    link: project.link
  }));

  return (
    <div 
      className="project-list"
      data-projects={JSON.stringify(projectData)}
    >
      // ... existing code ...
    </div>
  );
}; 