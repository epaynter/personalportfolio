import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {
  try {
    const { message } = await request.json();
    console.log('Creating new thread with initial message:', message);

    // Create a new thread
    const thread = await openai.beta.threads.create();
    console.log('Created thread:', thread.id);

    // Add the initial message to the thread
    const messageResponse = await openai.beta.threads.messages.create(thread.id, {
      role: 'user',
      content: message,
    });
    console.log('Added initial message to thread');

    return NextResponse.json({ threadId: thread.id });
  } catch (error) {
    console.error('Error creating thread:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 