import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import clientPromise from '../../../lib/mongodb';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const client = await clientPromise;
  const db = client.db();
  const collection = db.collection('assistantQuestions');

  try {
    switch (req.method) {
      case 'GET':
        const questions = await collection
          .find({})
          .sort({ createdAt: -1 })
          .toArray();
        return res.status(200).json(questions);

      case 'POST':
        const { question } = req.body;

        if (!question || typeof question !== 'string' || !question.trim()) {
          return res.status(400).json({ error: 'Question is required' });
        }

        const newQuestion = {
          question: question.trim(),
          createdAt: new Date(),
        };

        const result = await collection.insertOne(newQuestion);
        return res.status(201).json({ 
          _id: result.insertedId,
          ...newQuestion
        });

      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    console.error('Error handling assistant questions:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 