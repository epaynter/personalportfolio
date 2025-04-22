import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import clientPromise from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const { id } = req.query;
  
  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid question ID' });
  }
  
  const client = await clientPromise;
  const db = client.db();
  const collection = db.collection('assistantQuestions');
  
  try {
    switch (req.method) {
      case 'DELETE':
        const result = await collection.deleteOne({ _id: new ObjectId(id) });
        
        if (result.deletedCount === 0) {
          return res.status(404).json({ error: 'Question not found' });
        }
        
        return res.status(200).json({ message: 'Question deleted successfully' });
      
      default:
        res.setHeader('Allow', ['DELETE']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    console.error('Error handling assistant question:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 