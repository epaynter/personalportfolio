import OpenAI from 'openai';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Test OpenAI API: Initializing client');
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    console.log('Test OpenAI API: Testing API key');
    // Make a simple API call to test the key
    const response = await openai.models.list();
    
    console.log('Test OpenAI API: Success', { 
      modelCount: response.data.length,
      firstModel: response.data[0]?.id
    });
    
    return res.status(200).json({ 
      success: true, 
      message: 'OpenAI API key is valid',
      modelCount: response.data.length
    });
  } catch (error) {
    console.error('Test OpenAI API: Error', {
      name: error.name,
      message: error.message,
      status: error.status,
      response: error.response ? {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      } : 'No response data',
      stack: error.stack
    });
    
    return res.status(500).json({ 
      error: 'Failed to test OpenAI API',
      details: error.message
    });
  }
} 