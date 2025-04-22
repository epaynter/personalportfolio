import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

const ChatContext = createContext();

// Helper function to clean and format assistant response
const formatAssistantContent = (rawText) => {
  return rawText
    .replace(/\【.*?†.*?\】/g, '')   // Remove weird citation blocks
    .replace(/\[\d+\]/g, '')        // Remove citation numbers
    .replace(/(\d+)\.\s+/g, '- ')   // Turn numbered lists into bullets
    .replace(/\n{2,}/g, '\n\n')     // Normalize spacing
    .trim();
};

export function ChatProvider({ children }) {
  const [messages, setMessages] = useState([{
    role: 'assistant',
    content: "Hey! 👋\n\nI'm EliotAI, Eliot's AI agent here to help answer any questions you may have about his portfolio, projects, or experience.\n\nFeel free to ask me anything!"
  }]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [threadId, setThreadId] = useState(null);
  const eventSourceRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Clean up event source on unmount
  useEffect(() => {
    return () => {
      console.log('Cleaning up chat resources');
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const sendMessage = async (content) => {
    console.log('Sending message:', content);
    try {
      setIsLoading(true);
      setError(null);
      
      // Add user message to the chat
      const userMessage = { role: 'user', content };
      console.log('Adding user message to state');
      setMessages(prev => [...prev, userMessage]);
  
      // Step 1: Create a new thread if one doesn't exist
      let currentThreadId = threadId;
      if (!currentThreadId) {
        console.log('No existing thread, creating new one');
        const response = await fetch('/api/threads', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'OpenAI-Beta': 'assistants=v2'
          },
          body: JSON.stringify({ message: content }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Failed to create thread:', errorData);
          throw new Error(errorData.error || 'Failed to create thread');
        }

        const data = await response.json();
        currentThreadId = data.threadId;
        console.log('Created new thread:', currentThreadId);
        setThreadId(currentThreadId);
      } else {
        console.log('Using existing thread:', currentThreadId);
      }
  
      // Step 2: Add the message to the thread
      console.log('Adding message to thread');
      const messageRes = await fetch('/api/threads/messages', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'OpenAI-Beta': 'assistants=v2'
        },
        body: JSON.stringify({
          threadId: currentThreadId,
          content
        }),
      });
  
      if (!messageRes.ok) {
        const errorData = await messageRes.json();
        console.error('Failed to add message:', errorData);
        throw new Error(errorData.error || 'Failed to add message to thread');
      }
  
      // Step 3: Create a new run
      console.log('Creating new run');
      const runRes = await fetch('/api/threads/runs', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'OpenAI-Beta': 'assistants=v2'
        },
        body: JSON.stringify({
          threadId: currentThreadId
        }),
      });
  
      if (!runRes.ok) {
        const errorData = await runRes.json();
        console.error('Failed to create run:', errorData);
        throw new Error(errorData.error || 'Failed to create run');
      }
  
      const runData = await runRes.json();
      const runId = runData.runId;
      console.log('Created new run:', runId);
  
      // Step 4: Start streaming assistant response
      const eventSource = setupEventSource(currentThreadId, runId);
      eventSourceRef.current = eventSource;

    } catch (error) {
      console.error('Error sending message:', error);
      setError(error.message);
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    console.log('Clearing chat');
    setMessages([{
      role: 'assistant',
      content: "Hey! 👋\n\nI'm EliotAI, Eliot's AI agent here to help answer any questions you may have about his portfolio, projects, or experience.\n\nFeel free to ask me anything!"
    }]);
    setThreadId(null);
    setError(null);
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  };

  const setupEventSource = (threadId, runId) => {
    console.log('Setting up event source for streaming');
    const eventSource = new EventSource(`/api/threads/runs/stream?threadId=${threadId}&runId=${runId}`);
    
    // Start of assistant response
    eventSource.addEventListener('start', () => {
      console.log('Assistant response started');
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);
    });

    // Append each delta chunk
    eventSource.addEventListener('delta', (event) => {
      const { content } = JSON.parse(event.data);
      const cleanedContent = formatAssistantContent(content);
      console.log('Received delta:', cleanedContent);
      setMessages(prev => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];
        if (lastMessage && lastMessage.role === 'assistant') {
          return [...newMessages.slice(0, -1), { ...lastMessage, content: lastMessage.content + cleanedContent }];
        }
        return newMessages;
      });
    });

    // Completed
    eventSource.addEventListener('complete', () => {
      console.log('Assistant response completed');
      setIsLoading(false);
      eventSource.close();
      eventSourceRef.current = null;
    });

    // Error events from SSE stream
    eventSource.addEventListener('error', (event) => {
      console.error('SSE stream error:', event);
      setError('Failed to receive assistant response');
      setIsLoading(false);
      eventSource.close();
      eventSourceRef.current = null;
    });

    return eventSource;
  };

  return (
    <ChatContext.Provider value={{ 
      messages, 
      sendMessage, 
      clearChat, 
      isLoading,
      error,
      threadId
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}