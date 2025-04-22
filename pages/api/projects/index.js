import { connectToDatabase } from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  const { db } = await connectToDatabase();

  switch (req.method) {
    case 'GET':
      const projects = await db.collection('projects')
        .find({})
        .sort({ category: 1, position: 1 })
        .toArray();
      console.log('GET projects:', JSON.stringify(projects, null, 2));
      return res.status(200).json(projects);

    case 'POST':
      const project = req.body;
      console.log('POST project before processing:', JSON.stringify(project, null, 2));
      
      // Get the highest position for the category
      const lastProject = await db.collection('projects')
        .findOne(
          { category: project.category },
          { sort: { position: -1 } }
        );
      
      // Clean up the project object and ensure new description format
      const cleanProject = {
        ...project,
        shortDescription: project.shortDescription || '',
        longDescription: project.longDescription || '',
        tags: project.tags || [], // Ensure tags are included and default to empty array
        position: lastProject ? lastProject.position + 1 : 0, // Set position to be last in category
        // Ensure the old description field is not included
        description: undefined
      };
      
      console.log('POST project after processing:', JSON.stringify(cleanProject, null, 2));
      const result = await db.collection('projects').insertOne(cleanProject);
      return res.status(201).json(result);

    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
}