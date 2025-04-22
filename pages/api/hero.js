import { connectToDatabase } from '../../lib/mongodb';

export default async function handler(req, res) {
  const { db } = await connectToDatabase();

  switch (req.method) {
    case 'GET':
      const hero = await db.collection('hero').findOne({});
      return res.status(200).json(hero || {});

    case 'PUT':
      const data = req.body;
      await db.collection('hero').updateOne({}, { $set: data }, { upsert: true });
      return res.status(200).json({ message: 'Hero updated' });

    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
}