import { connectToDatabase } from '../../lib/mongodb';
import { getOpenAIClient } from '../../lib/openai';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify admin password
  const adminPassword = req.headers['x-admin-password'];
  if (adminPassword !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { filename, content, description } = req.body;
    
    if (!filename || !content) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Connect to the database
    const { db } = await connectToDatabase();
    
    // Check if the file already exists
    const existingFile = await db.collection('assistantFiles').findOne({ filename });
    
    if (existingFile) {
      // Update the existing file
      await db.collection('assistantFiles').updateOne(
        { filename },
        { 
          $set: { 
            content,
            description: description || existingFile.description,
            updatedAt: new Date()
          }
        }
      );
    } else {
      // Create a new file
      await db.collection('assistantFiles').insertOne({
        filename,
        content,
        description: description || '',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    // Update the OpenAI assistant's knowledge base
    const openai = getOpenAIClient();
    
    // Get the assistant ID from environment variables
    const assistantId = process.env.OPENAI_ASSISTANT_ID;
    if (!assistantId) {
      throw new Error('OPENAI_ASSISTANT_ID is not defined in environment variables');
    }
    
    // Create a file in OpenAI
    const file = await openai.files.create({
      file: Buffer.from(content),
      purpose: 'assistants'
    });
    
    // Attach the file to the assistant
    await openai.beta.assistants.files.create(
      assistantId,
      {
        file_id: file.id
      }
    );
    
    return res.status(200).json({ 
      success: true, 
      message: `Successfully updated ${filename} in the assistant's knowledge base` 
    });
  } catch (error) {
    console.error('Error updating assistant knowledge:', error);
    return res.status(500).json({ error: 'Failed to update assistant knowledge' });
  }
} 