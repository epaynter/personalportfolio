import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const threadId = searchParams.get('threadId');
    const runId = searchParams.get('runId');

    if (!threadId || !runId) {
      return new NextResponse('Missing threadId or runId', { status: 400 });
    }

    // Set SSE headers
    const headers = new Headers();
    headers.set('Content-Type', 'text/event-stream');
    headers.set('Cache-Control', 'no-cache');
    headers.set('Connection', 'keep-alive');

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Write initial event to establish connection
          controller.enqueue(encoder.encode('data: {"type": "start"}\n\n'));

          // Poll for run status
          let runStatus = 'queued';
          let attempts = 0;
          const maxAttempts = 20;
          let hasSentMessage = false;

          while (runStatus === 'queued' || runStatus === 'in_progress') {
            if (attempts >= maxAttempts) {
              controller.enqueue(encoder.encode('data: {"type": "error", "error": "Run timed out"}\n\n'));
              controller.close();
              return;
            }

            const run = await openai.beta.threads.runs.retrieve(threadId, runId);
            runStatus = run.status;

            if (runStatus === 'completed' && !hasSentMessage) {
              // Get the latest message
              const messages = await openai.beta.threads.messages.list(threadId);
              const latestMessage = messages.data[0];
              
              if (latestMessage && latestMessage.content[0].text) {
                const content = latestMessage.content[0].text.value;
                controller.enqueue(encoder.encode(`data: {"type": "delta", "content": "${content}"}\n\n`));
                hasSentMessage = true;
              }
              
              controller.enqueue(encoder.encode('data: {"type": "complete"}\n\n'));
              controller.close();
              return;
            }

            if (runStatus === 'failed' || runStatus === 'expired' || runStatus === 'cancelled') {
              controller.enqueue(encoder.encode(`data: {"type": "error", "error": "Run ${runStatus}"}\n\n`));
              controller.close();
              return;
            }

            attempts++;
            await new Promise(resolve => setTimeout(resolve, 1500));
          }
        } catch (error) {
          console.error('Stream error:', error);
          controller.enqueue(encoder.encode(`data: {"type": "error", "error": "${error.message}"}\n\n`));
          controller.close();
        }
      },
    });

    return new NextResponse(stream, { headers });
  } catch (error) {
    console.error('Stream endpoint error:', error);
    return new NextResponse(error.message, { status: 500 });
  }
} 