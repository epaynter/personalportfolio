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
    
    // If the file has content stored directly in the database
    if (file.content) {
      // Set headers for file download
      res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
      res.setHeader('Content-Type', 'text/plain');
      
      // Send the content
      return res.status(200).send(file.content);
    } 
    // If the file is stored as a file path
    else if (file.filePath) {
      // In a real implementation, you would read the file from the filesystem
      // For now, we'll just return an error
      return res.status(501).json({ 
        error: 'File download not implemented',
        message: 'The file is stored on the server but the download functionality is not implemented yet.'
      });
    } else {
      return res.status(404).json({ error: 'No content available for this file' });
    }
  } catch (error) {
    console.error('Error downloading file:', error);
    return res.status(500).json({ error: 'Failed to download file' });
  }
} 