import OpenAI from 'openai';

let openaiClient = null;

export function getOpenAIClient() {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      throw new Error('OpenAI API key is not configured. Please set OPENAI_API_KEY in your environment variables.');
    }

    openaiClient = new OpenAI({
      apiKey: apiKey,
    });
  }
  
  return openaiClient;
}

export async function createAssistantFile(fileId) {
  try {
    const client = getOpenAIClient();
    const assistantId = process.env.OPENAI_ASSISTANT_ID;
    
    if (!assistantId) {
      throw new Error('OpenAI Assistant ID is not configured. Please set OPENAI_ASSISTANT_ID in your environment variables.');
    }

    const file = await client.beta.assistants.files.create(
      assistantId,
      { file_id: fileId }
    );

    return file;
  } catch (error) {
    console.error('Error creating assistant file:', error);
    throw error;
  }
}

export async function deleteAssistantFile(fileId) {
  try {
    const client = getOpenAIClient();
    const assistantId = process.env.OPENAI_ASSISTANT_ID;
    
    if (!assistantId) {
      throw new Error('OpenAI Assistant ID is not configured. Please set OPENAI_ASSISTANT_ID in your environment variables.');
    }

    await client.beta.assistants.files.del(
      assistantId,
      fileId
    );
  } catch (error) {
    console.error('Error deleting assistant file:', error);
    throw error;
  }
}

export async function listAssistantFiles() {
  try {
    const client = getOpenAIClient();
    const assistantId = process.env.OPENAI_ASSISTANT_ID;
    
    if (!assistantId) {
      throw new Error('OpenAI Assistant ID is not configured. Please set OPENAI_ASSISTANT_ID in your environment variables.');
    }

    const files = await client.beta.assistants.files.list(assistantId);
    return files.data;
  } catch (error) {
    console.error('Error listing assistant files:', error);
    throw error;
  }
} 