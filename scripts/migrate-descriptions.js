import 'dotenv/config';
import { connectToDatabase } from '../lib/mongodb.js';

async function migrateDescriptions() {
  try {
    const { db } = await connectToDatabase();
    const projects = await db.collection('projects').find({}).toArray();
    
    console.log(`Found ${projects.length} projects to migrate`);
    
    for (const project of projects) {
      const update = {
        $set: {
          shortDescription: project.shortDescription || project.description || '',
          longDescription: project.longDescription || project.description || '',
        },
        $unset: {
          description: ""
        }
      };
      
      await db.collection('projects').updateOne(
        { _id: project._id },
        update
      );
      
      console.log(`Migrated project: ${project.title}`);
    }
    
    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrateDescriptions(); 