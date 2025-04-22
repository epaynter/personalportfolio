// File: pages/api/contact.js
import { connectToDatabase } from '../../lib/mongodb';

export default async function handler(req, res) {
  const { db } = await connectToDatabase();

  switch (req.method) {
    case 'GET':
      const contact = await db.collection('contact').findOne({});
      return res.status(200).json(contact || { 
        emailPlaceholder: "Email", 
        messagePlaceholder: "Message", 
        submitText: "Send", 
        socialLinks: [
          { name: "LinkedIn", url: "https://linkedin.com" },
          { name: "GitHub", url: "https://github.com" },
          { name: "Instagram", url: "https://instagram.com" },
        ],
      });

    case 'PUT':
      const data = req.body;
      await db.collection('contact').updateOne({}, { $set: data }, { upsert: true });
      return res.status(200).json({ message: 'Contact updated' });

    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
}