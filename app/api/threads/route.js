import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { connectToDatabase } from '../../../lib/mongodb';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {
  try {
    const { message } = await request.json();
    console.log('Creating new thread with initial message:', message);

    // Get all files from OpenAI
    const openaiFiles = await openai.files.list();
    const openaiFileIds = new Set(openaiFiles.data.map(file => file.id));

    // Get all loaded file IDs from our database
    const { db } = await connectToDatabase();
    const loadedFiles = await db.collection('assistantFiles')
      .find({ openaiFileId: { $exists: true, $ne: null } })
      .project({ openaiFileId: 1 })
      .toArray();
    
    // Filter to only include files that exist in OpenAI
    const validFileIds = loadedFiles
      .map(file => file.openaiFileId)
      .filter(fileId => openaiFileIds.has(fileId));

    // Create a new thread
    const thread = await openai.beta.threads.create();
    console.log('Created thread:', thread.id);

    // Add the initial message to the thread with valid file IDs
    const messageResponse = await openai.beta.threads.messages.create(thread.id, {
      role: 'user',
      content: message,
      attachments: validFileIds.map(fileId => ({
        file_id: fileId,
        tools: [{ type: 'file_search' }]
      }))
    });
    console.log('Added initial message to thread');

    return NextResponse.json({ threadId: thread.id });
  } catch (error) {
    console.error('Error creating thread:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 