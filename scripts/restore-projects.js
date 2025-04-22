require('dotenv').config({ path: '.env.local' });
const { connectToDatabase } = require('../lib/mongodb');

async function restoreProjects() {
  try {
    const { db } = await connectToDatabase();
    
    // Check if projects collection exists
    const collections = await db.listCollections().toArray();
    const hasProjectsCollection = collections.some(c => c.name === 'projects');
    
    if (!hasProjectsCollection) {
      console.log('Projects collection does not exist. Creating it...');
      await db.createCollection('projects');
    }
    
    // Get all projects
    const projects = await db.collection('projects').find({}).toArray();
    console.log(`Found ${projects.length} projects`);
    
    if (projects.length === 0) {
      console.log('No projects found. Creating sample projects...');
      
      // Create sample projects
      const sampleProjects = [
        {
          title: 'Sample Project 1',
          shortDescription: 'This is a short description for the project card.',
          longDescription: 'This is a longer, more detailed description that will appear in the project modal.',
          image: 'https://via.placeholder.com/800x600',
          category: 'Web Development',
          link: 'https://example.com',
          content: [
            { type: 'image', url: 'https://via.placeholder.com/800x600' }
          ],
          selectedContentIndex: 0
        },
        {
          title: 'Sample Project 2',
          shortDescription: 'Another short description for the project card.',
          longDescription: 'Another longer, more detailed description that will appear in the project modal.',
          image: 'https://via.placeholder.com/800x600',
          category: 'Mobile App',
          link: 'https://example.com',
          content: [
            { type: 'image', url: 'https://via.placeholder.com/800x600' }
          ],
          selectedContentIndex: 0
        }
      ];
      
      const result = await db.collection('projects').insertMany(sampleProjects);
      console.log(`Created ${result.insertedCount} sample projects`);
    } else {
      // Check if projects have the new description format
      let updatedCount = 0;
      
      for (const project of projects) {
        const needsUpdate = !project.shortDescription || !project.longDescription;
        
        if (needsUpdate) {
          const update = {
            $set: {
              shortDescription: project.shortDescription || project.description || 'No description available',
              longDescription: project.longDescription || project.description || 'No description available',
            }
          };
          
          await db.collection('projects').updateOne(
            { _id: project._id },
            update
          );
          
          updatedCount++;
        }
      }
      
      if (updatedCount > 0) {
        console.log(`Updated ${updatedCount} projects with the new description format`);
      } else {
        console.log('All projects already have the new description format');
      }
    }
    
    console.log('Restore completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Restore failed:', error);
    process.exit(1);
  }
}

restoreProjects(); 