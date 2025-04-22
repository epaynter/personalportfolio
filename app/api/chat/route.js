import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const threadId = searchParams.get('threadId');
  const message = searchParams.get('message');

  if (!threadId || !message) {
    return new NextResponse('Missing threadId or message', { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  // Start the response stream
  const response = new NextResponse(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });

  // Process the message in the background
  (async () => {
    try {
      // Send start event
      await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'start' })}\n\n`));

      // Create a run
      const run = await openai.beta.threads.runs.create(threadId, {
        assistant_id: process.env.OPENAI_ASSISTANT_ID,
      });

      // Poll for completion
      let runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
      while (runStatus.status === 'queued' || runStatus.status === 'in_progress') {
        await new Promise(resolve => setTimeout(resolve, 1000));
        runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
      }

      if (runStatus.status === 'completed') {
        // Get the latest message
        const messages = await openai.beta.threads.messages.list(threadId);
        const latestMessage = messages.data[0];
        
        // Stream the content
        for (const content of latestMessage.content) {
          if (content.type === 'text') {
            await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'delta', content: content.text.value })}\n\n`));
          }
        }

        // Send complete event
        await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'complete' })}\n\n`));
      } else {
        throw new Error(`Run failed with status: ${runStatus.status}`);
      }
    } catch (error) {
      console.error('Error in chat stream:', error);
      await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`));
    } finally {
      await writer.close();
    }
  })();

  return response;
} 