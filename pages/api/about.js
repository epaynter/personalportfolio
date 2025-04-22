import { connectToDatabase } from '../../lib/mongodb';

export default async function handler(req, res) {
  const { db } = await connectToDatabase();

  switch (req.method) {
    case 'GET':
      const about = await db.collection('about').findOne({});
      return res.status(200).json(about || {});

    case 'PUT':
      const data = req.body;
      await db.collection('about').updateOne({}, { $set: data }, { upsert: true });
      return res.status(200).json({ message: 'About updated' });

    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
}