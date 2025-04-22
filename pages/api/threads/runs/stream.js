export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).end();
  }

  const { threadId, runId } = req.query;
  if (!threadId || !runId) {
    return res.status(400).json({ error: 'Missing threadId or runId' });
  }

  console.log('Stream request received:', {
    threadId,
    runId,
    timestamp: new Date().toISOString()
  });

  // Configure SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const OPENAI_HEADERS = {
    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    'OpenAI-Beta': 'assistants=v2',
    'Content-Type': 'application/json',
  };

  let attempts = 0;
  const maxAttempts = 20;

  const poll = async () => {
    try {
      // Check run status
      const runRes = await fetch(
        `https://api.openai.com/v1/threads/${threadId}/runs/${runId}`,
        { headers: OPENAI_HEADERS }
      );
      const runData = await runRes.json();

      if (!runRes.ok) {
        res.write(`event: error\ndata: ${JSON.stringify(runData)}\n\n`);
        return res.end();
      }

      if (runData.status === 'completed') {
        // Fetch the assistant's messages
        const msgRes = await fetch(
          `https://api.openai.com/v1/threads/${threadId}/messages`,
          { headers: OPENAI_HEADERS }
        );
        const msgData = await msgRes.json();

        if (!msgRes.ok) {
          res.write(`event: error\ndata: ${JSON.stringify(msgData)}\n\n`);
        } else {
          // Get the assistant's content
          const assistantMsg = msgData.data.find(
            m => m.role === 'assistant' && m.content?.[0]?.text?.value
          );
          const content = assistantMsg?.content?.[0]?.text?.value || '';

          // Emit SSE events
          const startEvent = { type: 'start' };
          console.log('Sending start event:', startEvent);
          res.write(`event: start\ndata: ${JSON.stringify(startEvent)}\n\n`);

          const deltaEvent = { type: 'delta', content };
          console.log('Sending delta event:', {
            threadId,
            runId,
            contentLength: content.length,
            contentPreview: content.substring(0, 100) + '...'
          });
          res.write(`event: delta\ndata: ${JSON.stringify(deltaEvent)}\n\n`);

          const completeEvent = { type: 'complete' };
          console.log('Sending complete event:', { threadId, runId });
          res.write(`event: complete\ndata: ${JSON.stringify(completeEvent)}\n\n`);
        }
        return res.end();
      }

      // Handle other statuses or retry
      attempts++;
      if (attempts >= maxAttempts) {
        res.write(`event: error\ndata: ${JSON.stringify({ error: 'Run timeout' })}\n\n`);
        return res.end();
      }

      console.log(`Polling run status (attempt ${attempts + 1}/${maxAttempts}):`, {
        threadId,
        runId
      });

      setTimeout(poll, 1500);
    } catch (err) {
      console.error('Error in run stream API:', err);
      res.write(`event: error\ndata: ${JSON.stringify({ error: err.message })}\n\n`);
      return res.end();
    }
  };

  // Start polling loop
  poll();

  // Clean up on client disconnect
  req.on('close', () => {
    res.end();
  });
}