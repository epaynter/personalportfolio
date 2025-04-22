import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { projectsToMarkdown } from '../utils/projectToMarkdown.js';
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ASSISTANT_ID = process.env.OPENAI_ASSISTANT_ID;

if (!OPENAI_API_KEY || !ASSISTANT_ID) {
  console.error('Error: OPENAI_API_KEY and OPENAI_ASSISTANT_ID must be set in .env.local file');
  process.exit(1);
}

async function fetchProjects() {
  try {
    // Start the development server if not already running
    const baseUrl = process.env.NEXT_PUBLIC_DOMAIN || 'localhost';
    const port = process.env.PORT || 3001;
    const response = await fetch(`http://${baseUrl}:${port}/api/projects`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch projects: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.projects || [];
  } catch (error) {
    console.error('Error fetching projects:', error);
    throw error;
  }
}

async function updateAssistantKnowledge(projects) {
  try {
    // Convert projects to markdown
    const markdown = projectsToMarkdown(projects);
    
    // Create a temporary file with the markdown content
    const tempFilePath = path.join(process.cwd(), 'temp', 'projects.md');
    fs.mkdirSync(path.dirname(tempFilePath), { recursive: true });
    fs.writeFileSync(tempFilePath, markdown);
    
    // Upload the file to OpenAI
    const formData = new FormData();
    formData.append('file', fs.createReadStream(tempFilePath));
    formData.append('purpose', 'assistants');
    
    const uploadResponse = await fetch('https://api.openai.com/v1/files', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'OpenAI-Beta': 'assistants=v2'
      },
      body: formData
    });
    
    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.json();
      throw new Error(`Failed to upload file: ${errorData.error?.message || uploadResponse.statusText}`);
    }
    
    const { id: fileId } = await uploadResponse.json();
    
    // Get current assistant files
    const assistantResponse = await fetch(`https://api.openai.com/v1/assistants/${ASSISTANT_ID}`, {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      }
    });
    
    if (!assistantResponse.ok) {
      const errorData = await assistantResponse.json();
      throw new Error(`Failed to get assistant: ${errorData.error?.message || assistantResponse.statusText}`);
    }
    
    const assistant = await assistantResponse.json();
    const existingFiles = assistant.file_ids || [];
    
    // Update the assistant with both existing and new files
    const updateResponse = await fetch(`https://api.openai.com/v1/assistants/${ASSISTANT_ID}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({
        file_ids: [...existingFiles, fileId]
      })
    });
    
    if (!updateResponse.ok) {
      const errorData = await updateResponse.json();
      throw new Error(`Failed to update assistant: ${errorData.error?.message || updateResponse.statusText}`);
    }
    
    console.log('Successfully updated assistant knowledge base with current projects');
    
    // Clean up temporary file
    fs.unlinkSync(tempFilePath);
    
  } catch (error) {
    console.error('Error updating assistant knowledge:', error);
    throw error;
  }
}

async function main() {
  try {
    console.log('Fetching current portfolio projects...');
    const projects = await fetchProjects();
    
    console.log('Updating assistant knowledge base...');
    await updateAssistantKnowledge(projects);
    
    console.log('Process completed successfully');
  } catch (error) {
    console.error('Process failed:', error);
    process.exit(1);
  }
}

main(); 