import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// In-memory cache for audio chunks
const audioCache = new Map();

// Function to generate a hash for caching
function generateHash(text, style = 'default') {
  return crypto.createHash('md5').update(`${text}-${style}`).digest('hex');
}

// Function to split text into chunks for faster processing
function splitIntoChunks(text, maxChunkLength = 100) {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const chunks = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length <= maxChunkLength) {
      currentChunk += sentence;
    } else {
      if (currentChunk) chunks.push(currentChunk.trim());
      currentChunk = sentence;
    }
  }
  if (currentChunk) chunks.push(currentChunk.trim());
  return chunks;
}

// Function to add emotional realism to text
function addEmotionalRealism(text, style = 'default') {
  let styledText = text;
  
  switch (style) {
    case 'energetic':
      styledText = text
        .replace(/([.!?])\s+/g, '$1\n')
        .replace(/\b(important|key)\b/gi, '👉 $1')
        .replace(/\b(here's)\b/gi, '⚡ $1')
        .replace(/\b(amazing|great|excellent)\b/gi, '✨ $1');
      break;
    case 'thoughtful':
      styledText = text
        .replace(/([.!?])\s+/g, '$1\n')
        .replace(/\b(consider|think|believe)\b/gi, '🤔 $1')
        .replace(/\b(interesting|fascinating)\b/gi, '💭 $1');
      break;
    case 'friendly':
      styledText = text
        .replace(/([.!?])\s+/g, '$1\n')
        .replace(/\b(hello|hi|hey)\b/gi, '👋 $1')
        .replace(/\b(thanks|thank you)\b/gi, '🙏 $1');
      break;
    default:
      styledText = text.replace(/([.!?])\s+/g, '$1\n');
  }
  
  return styledText;
}

export async function POST(request) {
  try {
    const { text, style = 'default' } = await request.json();

    if (!text) {
      return new NextResponse('Missing text parameter', { status: 400 });
    }

    // Generate cache key
    const cacheKey = generateHash(text, style);
    
    // Check cache first
    if (audioCache.has(cacheKey)) {
      console.log('🎵 Using cached audio for:', text.substring(0, 30) + '...');
      const cachedAudio = audioCache.get(cacheKey);
      return new NextResponse(cachedAudio, {
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Length': cachedAudio.length.toString(),
          'X-Cache': 'HIT'
        },
      });
    }

    // Split text into chunks for faster processing
    const chunks = splitIntoChunks(text);
    const audioChunks = [];

    // Process each chunk in parallel
    const chunkPromises = chunks.map(async (chunk) => {
      const styledChunk = addEmotionalRealism(chunk, style);
      const mp3 = await openai.audio.speech.create({
        model: "tts-1-hd",
        voice: "onyx",
        input: styledChunk,
      });
      return Buffer.from(await mp3.arrayBuffer());
    });

    // Wait for all chunks to be processed
    const processedChunks = await Promise.all(chunkPromises);
    
    // Combine all chunks into a single buffer
    const combinedBuffer = Buffer.concat(processedChunks);
    
    // Cache the result
    audioCache.set(cacheKey, combinedBuffer);
    
    // Clean up old cache entries if cache gets too large
    if (audioCache.size > 100) {
      const oldestKey = audioCache.keys().next().value;
      audioCache.delete(oldestKey);
    }

    return new NextResponse(combinedBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': combinedBuffer.length.toString(),
        'X-Cache': 'MISS'
      },
    });
  } catch (error) {
    console.error('Error in text-to-speech:', error);
    return new NextResponse(error.message, { status: 500 });
  }
} 