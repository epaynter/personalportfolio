import { NextResponse } from 'next/server';
import OpenAI from 'openai';

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

    // Add the message to the thread
    const message = await openai.beta.threads.messages.create(threadId, {
      role: 'user',
      content: content,
    });
    console.log('Added message to thread:', message.id);

    return NextResponse.json({ messageId: message.id });
  } catch (error) {
    console.error('Error adding message:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 