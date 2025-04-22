import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]";
import { connectToDatabase } from "../../../../lib/mongodb";
import { ObjectId } from "mongodb";
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check admin authentication
  const session = await getServerSession(req, res, authOptions);
  const isAdmin = session?.user?.email === process.env.ADMIN_EMAIL;
  
  // Also check for admin password in headers as a fallback
  const adminPassword = req.headers.authorization?.split(' ')[1];
  const isAdminByPassword = adminPassword === process.env.NEXT_PUBLIC_ADMIN_PASSWORD;
  
  if (!isAdmin && !isAdminByPassword) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'File ID is required' });
  }

  try {
    const { db } = await connectToDatabase();
    
    // Find the file by ID
    const file = await db.collection('assistantFiles').findOne({ _id: new ObjectId(id) });
    
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    // Get the file content
    let content = '';
    let errorMessage = null;
    
    // If the file has content stored directly in the database
    if (file.content) {
      content = file.content;
    } 
    // If the file is stored as a file path
    else if (file.filePath) {
      try {
        // Read the file from the filesystem
        const filePath = path.join(process.cwd(), file.filePath);
        console.log(`Attempting to read file from: ${filePath}`);
        
        if (fs.existsSync(filePath)) {
          content = fs.readFileSync(filePath, 'utf8');
          console.log(`Successfully read file with ${content.length} characters`);
        } else {
          errorMessage = `File not found at path: ${filePath}`;
          console.error(errorMessage);
          content = `File not found on server at path: ${file.filePath}`;
        }
      } catch (error) {
        errorMessage = `Error reading file: ${error.message}`;
        console.error(errorMessage);
        content = `Error reading file content: ${error.message}`;
      }
    } else {
      errorMessage = 'No content available for this file';
      content = 'No content available for this file.';
    }
    
    // Limit the content to 200 lines for preview
    const lines = content.split('\n');
    const previewLines = lines.slice(0, 200);
    const previewContent = previewLines.join('\n');
    
    // Add a message if the content was truncated
    const truncated = lines.length > 200;
    
    return res.status(200).json({ 
      content: previewContent,
      truncated,
      totalLines: lines.length,
      filename: file.filename,
      fileType: file.fileType || path.extname(file.filename).slice(1),
      error: errorMessage
    });
  } catch (error) {
    console.error('Error fetching file content:', error);
    return res.status(500).json({ error: `Failed to fetch file content: ${error.message}` });
  }
} 