/**
 * Converts an array of projects to a markdown string
 * @param {Array} projects - Array of project objects
 * @returns {string} - Markdown formatted string of projects
 */
export function projectsToMarkdown(projects) {
  if (!Array.isArray(projects) || projects.length === 0) {
    return 'No projects available.';
  }

  let markdown = '# Portfolio Projects\n\n';
  
  projects.forEach((project, index) => {
    markdown += `## ${project.title}\n\n`;
    
    // Add description
    if (project.description) {
      markdown += `${project.description}\n\n`;
    }
    
    // Add technologies
    if (project.technologies && project.technologies.length > 0) {
      markdown += '### Technologies Used\n';
      markdown += project.technologies.map(tech => `- ${tech}`).join('\n');
      markdown += '\n\n';
    }
    
    // Add features
    if (project.features && project.features.length > 0) {
      markdown += '### Key Features\n';
      markdown += project.features.map(feature => `- ${feature}`).join('\n');
      markdown += '\n\n';
    }
    
    // Add links
    if (project.links) {
      markdown += '### Links\n';
      if (project.links.github) {
        markdown += `- [GitHub Repository](${project.links.github})\n`;
      }
      if (project.links.demo) {
        markdown += `- [Live Demo](${project.links.demo})\n`;
      }
      markdown += '\n';
    }
    
    // Add image if available
    if (project.image) {
      markdown += `![${project.title}](${project.image})\n\n`;
    }
    
    // Add separator between projects
    if (index < projects.length - 1) {
      markdown += '---\n\n';
    }
  });
  
  return markdown;
} 