require('dotenv').config({ path: '.env.local' });
const { connectToDatabase } = require('../lib/mongodb');

async function examineProjects() {
  try {
    const { db } = await connectToDatabase();
    
    // Get all projects
    const projects = await db.collection('projects').find({}).toArray();
    console.log(`Found ${projects.length} projects`);
    
    // Examine each project
    projects.forEach((project, index) => {
      console.log(`\nProject ${index + 1}: ${project.title}`);
      console.log('ID:', project._id);
      console.log('Short Description:', project.shortDescription || 'MISSING');
      console.log('Long Description:', project.longDescription || 'MISSING');
      console.log('Category:', project.category || 'MISSING');
      console.log('Content Items:', project.content ? project.content.length : 0);
      
      if (project.content && project.content.length > 0) {
        console.log('Content Types:', project.content.map(c => c.type).join(', '));
      }
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Examination failed:', error);
    process.exit(1);
  }
}

examineProjects(); 