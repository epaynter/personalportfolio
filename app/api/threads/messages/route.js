import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { connectToDatabase } from '../../../../lib/mongodb';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {
  try {
    const { threadId, content } = await request.json();
    console.log('Adding message to thread:', threadId);

    if (!threadId || !content) {
      console.error('Missing threadId or content');
      return NextResponse.json({ error: 'Missing threadId or content' }, { status: 400 });
    }

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

    // Add the message to the thread with valid file IDs
    const message = await openai.beta.threads.messages.create(threadId, {
      role: 'user',
      content: content,
      attachments: validFileIds.map(fileId => ({
        file_id: fileId,
        tools: [{ type: 'file_search' }]
      }))
    });
    console.log('Added message to thread:', message.id);

    return NextResponse.json({ messageId: message.id });
  } catch (error) {
    console.error('Error adding message:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 