// This script sets up an OpenAI Assistant with the GPT-4o model
// Run with: node scripts/setup-assistant.js

require('dotenv').config({ path: '.env.local' });

async function setupAssistant() {
  try {
    console.log('Setting up OpenAI Assistant...');
    
    // Debug: Log environment variables (without exposing the full API key)
    const apiKey = process.env.OPENAI_API_KEY;
    console.log('API Key present:', apiKey ? 'Yes' : 'No');
    if (apiKey) {
      console.log('API Key starts with:', apiKey.substring(0, 4) + '...');
    } else {
      console.log('ERROR: OPENAI_API_KEY is not set in .env.local');
      console.log('Please make sure your .env.local file contains:');
      console.log('OPENAI_API_KEY=your_api_key_here');
      return;
    }
    
    // Create the assistant
    const response = await fetch('https://api.openai.com/v1/assistants', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'OpenAI-Beta': 'assistants=v2',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Portfolio Assistant',
        instructions: 'You are a helpful assistant for a portfolio website. You can answer questions about the portfolio owner, their projects, and provide information about their skills and experience.',
        model: 'gpt-4o',
        tools: [
          { type: 'code_interpreter' }
        ],
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      console.error('Error creating assistant:', error);
      return;
    }
    
    const data = await response.json();
    console.log('Assistant created successfully!');
    console.log('Assistant ID:', data.id);
    console.log('\nAdd this to your .env.local file:');
    console.log(`OPENAI_ASSISTANT_ID=${data.id}`);
    
  } catch (error) {
    console.error('Error setting up assistant:', error);
  }
}

setupAssistant(); 
