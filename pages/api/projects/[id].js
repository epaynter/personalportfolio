import { connectToDatabase } from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  const { db } = await connectToDatabase();
  const { id } = req.query;

  switch (req.method) {
    case 'GET':
      const project = await db.collection('projects').findOne({ _id: new ObjectId(id) });
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
      return res.status(200).json(project);

    case 'PUT':
      const updateData = {
        ...req.body,
        tags: req.body.tags || [], // Ensure tags are included and default to empty array
        // Ensure the old description field is not included
        description: undefined
      };
      
      const result = await db.collection('projects').updateOne(
        { _id: new ObjectId(id) },
        { $set: updateData }
      );
      
      if (result.matchedCount === 0) {
        return res.status(404).json({ message: 'Project not found' });
      }
      return res.status(200).json({ message: 'Project updated successfully' });

    case 'DELETE':
      const deleteResult = await db.collection('projects').deleteOne({ _id: new ObjectId(id) });
      if (deleteResult.deletedCount === 0) {
        return res.status(404).json({ message: 'Project not found' });
      }
      return res.status(200).json({ message: 'Project deleted successfully' });

    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
}