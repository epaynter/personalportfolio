import { connectToDatabase } from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { projects } = req.body;

    if (!Array.isArray(projects)) {
      return res.status(400).json({ message: 'Invalid request body' });
    }

    const { db } = await connectToDatabase();

    // Update each project's position and category
    const updatePromises = projects.map(({ _id, position, categoryId }) =>
      db.collection('projects').updateOne(
        { _id: new ObjectId(_id) },
        { $set: { position, categoryId: new ObjectId(categoryId) } }
      )
    );

    await Promise.all(updatePromises);

    // Fetch and return the updated projects
    const updatedProjects = await db.collection('projects')
      .find({})
      .sort({ position: 1 })
      .toArray();

    res.status(200).json(updatedProjects);
  } catch (error) {
    console.error('Error reordering projects:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
} 