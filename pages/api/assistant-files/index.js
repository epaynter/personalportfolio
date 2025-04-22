import { connectToDatabase } from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  // Verify admin password
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader.split(' ')[1] !== process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { db } = await connectToDatabase();

  if (req.method === 'GET') {
    try {
      const files = await db.collection('assistant_files').find({}).toArray();
      res.status(200).json(files);
    } catch (error) {
      console.error('Error fetching files:', error);
      res.status(500).json({ error: 'Failed to fetch files' });
    }
  } else if (req.method === 'POST') {
    const form = new formidable.IncomingForm();
    
    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error('Error parsing form:', err);
        return res.status(500).json({ error: 'Failed to parse form' });
      }

      const file = files.file;
      const description = fields.description || '';

      try {
        // Read file content
        const fileContent = fs.readFileSync(file.filepath, 'utf8');
        
        // Create file document
        const fileDoc = {
          filename: file.originalFilename,
          content: fileContent,
          description,
          size: file.size,
          uploadDate: new Date(),
          lastModified: new Date(),
        };

        // Insert into database
        const result = await db.collection('assistant_files').insertOne(fileDoc);
        
        // Clean up temporary file
        fs.unlinkSync(file.filepath);

        res.status(201).json({ ...fileDoc, _id: result.insertedId });
      } catch (error) {
        console.error('Error saving file:', error);
        res.status(500).json({ error: 'Failed to save file' });
      }
    });
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 