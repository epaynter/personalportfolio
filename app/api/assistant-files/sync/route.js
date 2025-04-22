import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { connectToDatabase } from '../../../../lib/mongodb';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {
  try {
    const { db } = await connectToDatabase();
    
    // Get all files from OpenAI
    const openaiFiles = await openai.files.list();
    const openaiFileIds = openaiFiles.data.map(file => file.id);
    
    // Get all files from our database
    const dbFiles = await db.collection('assistantFiles')
      .find({ openaiFileId: { $exists: true, $ne: null } })
      .toArray();
    
    // Find files that exist in our database but not in OpenAI
    const filesToUpdate = dbFiles.filter(dbFile => !openaiFileIds.includes(dbFile.openaiFileId));
    
    // Update these files in our database
    if (filesToUpdate.length > 0) {
      await db.collection('assistantFiles').updateMany(
        { 
          openaiFileId: { 
            $in: filesToUpdate.map(file => file.openaiFileId) 
          } 
        },
        { 
          $set: { 
            openaiFileId: null,
            status: 'deleted'
          } 
        }
      );
    }
    
    return NextResponse.json({ 
      message: 'Database synced with OpenAI files',
      updatedFiles: filesToUpdate.length
    });
  } catch (error) {
    console.error('Error syncing files:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 