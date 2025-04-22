import { NextResponse } from 'next/server';
import OpenAI from 'openai';

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

    // Create a new run
    const run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: process.env.OPENAI_ASSISTANT_ID,
    });

    console.log('Created run:', run.id);
    return NextResponse.json({ runId: run.id });
  } catch (error) {
    console.error('Error creating run:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 