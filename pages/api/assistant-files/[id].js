import { connectToDatabase } from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  // Verify admin password
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader.split(' ')[1] !== process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id } = req.query;
  const { db } = await connectToDatabase();

  if (req.method === 'GET') {
    try {
      const file = await db.collection('assistant_files').findOne({ _id: new ObjectId(id) });
      if (!file) {
        return res.status(404).json({ error: 'File not found' });
      }
      res.status(200).json(file);
    } catch (error) {
      console.error('Error fetching file:', error);
      res.status(500).json({ error: 'Failed to fetch file' });
    }
  } else if (req.method === 'PUT') {
    try {
      const { content } = req.body;
      const result = await db.collection('assistant_files').updateOne(
        { _id: new ObjectId(id) },
        { 
          $set: { 
            content,
            lastModified: new Date()
          } 
        }
      );
      
      if (result.matchedCount === 0) {
        return res.status(404).json({ error: 'File not found' });
      }
      
      res.status(200).json({ message: 'File updated successfully' });
    } catch (error) {
      console.error('Error updating file:', error);
      res.status(500).json({ error: 'Failed to update file' });
    }
  } else if (req.method === 'DELETE') {
    try {
      const result = await db.collection('assistant_files').deleteOne({ _id: new ObjectId(id) });
      
      if (result.deletedCount === 0) {
        return res.status(404).json({ error: 'File not found' });
      }
      
      res.status(200).json({ message: 'File deleted successfully' });
    } catch (error) {
      console.error('Error deleting file:', error);
      res.status(500).json({ error: 'Failed to delete file' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 