import { connectToDatabase } from '../../lib/mongodb';
import OpenAI from 'openai';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: false,
  },
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check authentication
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  if (token !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  try {
    const form = formidable({
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB limit
    });
    
    const [fields, files] = await form.parse(req);
    const file = files.file[0];
    const description = fields.description ? fields.description[0] : '';

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Get file extension and determine file type
    const fileExtension = path.extname(file.originalFilename).toLowerCase();
    const isTextFile = ['.txt', '.md', '.json', '.csv'].includes(fileExtension);
    const isImageFile = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(fileExtension);
    const isDocumentFile = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'].includes(fileExtension);
    
    // Read file content
    const fileContent = await fs.promises.readFile(file.filepath, 'utf8');
    
    // For non-text files, we'll store metadata but not create an OpenAI file
    let openaiFileId = null;
    
    if (isTextFile) {
      // Create file in OpenAI
      const openaiFile = await openai.files.create({
        file: fs.createReadStream(file.filepath),
        purpose: 'assistants'
      });
      
      openaiFileId = openaiFile.id;
    }

    // Store file metadata and content in database
    const { db } = await connectToDatabase();
    const result = await db.collection('assistantFiles').insertOne({
      filename: file.originalFilename,
      content: fileContent,
      openaiFileId: openaiFileId,
      uploadDate: new Date(),
      size: file.size,
      type: file.mimetype,
      extension: fileExtension,
      isTextFile: isTextFile,
      isImageFile: isImageFile,
      isDocumentFile: isDocumentFile,
      description: description
    });

    // Clean up temporary file
    await fs.promises.unlink(file.filepath);

    return res.status(200).json({ 
      message: 'File uploaded successfully',
      fileId: result.insertedId,
      openaiFileId: openaiFileId
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return res.status(500).json({ error: 'Failed to upload file' });
  }
} 