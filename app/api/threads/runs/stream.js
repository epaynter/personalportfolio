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

    // Log incoming request parameters
    console.log('Stream request received:', {
      threadId,
      runId,
      timestamp: new Date().toISOString()
    });

    if (!threadId || !runId) {
      console.error('Missing required parameters:', { threadId, runId });
      return new NextResponse('Missing threadId or runId', { status: 400 });
    }

    // Set SSE headers
    const headers = new Headers({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send start event
          controller.enqueue(encoder.encode(`event: start\ndata: ${JSON.stringify({ type: 'start' })}\n\n`));

          // Poll for run status
          let runStatus = 'queued';
          let attempts = 0;
          const maxAttempts = 20;
          let hasSentMessage = false;

          while (runStatus === 'queued' || runStatus === 'in_progress') {
            if (attempts >= maxAttempts) {
              controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({ type: 'error', error: 'Run timed out' })}\n\n`));
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
                // Send delta event with content
                controller.enqueue(encoder.encode(`event: delta\ndata: ${JSON.stringify({ type: 'delta', content })}\n\n`));
                hasSentMessage = true;
              }
              
              // Send complete event
              controller.enqueue(encoder.encode(`event: complete\ndata: ${JSON.stringify({ type: 'complete' })}\n\n`));
              controller.close();
              return;
            }

            if (runStatus === 'failed' || runStatus === 'expired' || runStatus === 'cancelled') {
              // Send error event with specific status
              controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({ type: 'error', error: `Run ${runStatus}` })}\n\n`));
              controller.close();
              return;
            }

            attempts++;
            await new Promise(resolve => setTimeout(resolve, 1500));
          }
        } catch (error) {
          console.error('Stream error:', error);
          // Send error event with error message
          controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`));
          controller.close();
        }
      },
    });

    return new NextResponse(stream, { headers });
  } catch (error) {
    console.error('Stream endpoint error:', error);
    return new NextResponse(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 