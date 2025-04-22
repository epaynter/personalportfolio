import { connectToDatabase } from '../../lib/mongodb';
import { OpenAI } from 'openai';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { ObjectId } from 'mongodb';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
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

  const { fileId, content } = req.body;

  if (!fileId || !content) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const { db } = await connectToDatabase();

    // Get the file from the database
    const file = await db.collection('assistantFiles').findOne({
      _id: new ObjectId(fileId),
    });

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // If the file has an OpenAI file ID, update it
    if (file.openaiFileId) {
      try {
        // Delete the old file from OpenAI
        await openai.files.del(file.openaiFileId);

        // Create a new file in OpenAI
        const newFile = await openai.files.create({
          file: Buffer.from(content),
          purpose: 'assistants',
        });

        // Update the file in the database
        await db.collection('assistantFiles').updateOne(
          { _id: new ObjectId(fileId) },
          {
            $set: {
              content,
              openaiFileId: newFile.id,
              updatedAt: new Date(),
            },
          }
        );
      } catch (error) {
        console.error('Error updating OpenAI file:', error);
        return res.status(500).json({ error: 'Failed to update OpenAI file' });
      }
    } else {
      // Update the file in the database without OpenAI
      await db.collection('assistantFiles').updateOne(
        { _id: new ObjectId(fileId) },
        {
          $set: {
            content,
            updatedAt: new Date(),
          },
        }
      );
    }

    return res.status(200).json({ message: 'File updated successfully' });
  } catch (error) {
    console.error('Error updating file:', error);
    return res.status(500).json({ error: 'Failed to update file' });
  }
} 