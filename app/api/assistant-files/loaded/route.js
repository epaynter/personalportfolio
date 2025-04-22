import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../lib/mongodb';

export async function GET() {
  try {
    const { db } = await connectToDatabase();
    
    // Get all files that have an OpenAI file ID (meaning they're loaded in the assistant)
    const loadedFiles = await db.collection('assistantFiles')
      .find({ openaiFileId: { $exists: true, $ne: null } })
      .project({ _id: 1, filename: 1, openaiFileId: 1 })
      .toArray();
    
    return NextResponse.json(loadedFiles);
  } catch (error) {
    console.error('Error fetching loaded files:', error);
    return NextResponse.json({ error: 'Failed to fetch loaded files' }, { status: 500 });
  }
} 