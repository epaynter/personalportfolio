import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { connectToDatabase } from '../../../../lib/mongodb';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {
  try {
    const { threadId } = await request.json();
    console.log('Creating run for thread:', threadId);

    if (!threadId) {
      console.error('Missing threadId');
      return NextResponse.json({ error: 'Missing threadId' }, { status: 400 });
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

    // Create a new run with valid file IDs in tool resources
    const run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: process.env.OPENAI_ASSISTANT_ID,
      tool_resources: {
        file_search: {
          vector_stores: validFileIds.map(fileId => ({
            file_ids: [fileId]
          }))
        }
      }
    });

    console.log('Created run:', run.id);
    return NextResponse.json({ runId: run.id });
  } catch (error) {
    console.error('Error creating run:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 