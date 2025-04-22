import { generateRegistrationOptions } from '@simplewebauthn/server';
import { connectToDatabase } from '../../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { db } = await connectToDatabase();
    
    // Check if a credential already exists
    const existingCredential = await db.collection('webauthn').findOne({ type: 'credential' });
    if (existingCredential) {
      return res.status(400).json({ message: 'A Passkey is already registered. Only one Passkey is allowed.' });
    }

    // Generate registration options
    const options = await generateRegistrationOptions({
      rpName: 'Portfolio Admin',
      rpID: process.env.NEXT_PUBLIC_DOMAIN || 'localhost',
      userID: 'admin',
      userName: 'Admin User',
      attestationType: 'none',
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
      },
    });

    // Store the challenge in the database for verification
    await db.collection('webauthn').updateOne(
      { type: 'challenge' },
      { $set: { challenge: options.challenge } },
      { upsert: true }
    );

    return res.status(200).json(options);
  } catch (error) {
    console.error('Registration options error:', error);
    // Log more details about the error
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code,
      codeName: error.codeName
    });
    return res.status(500).json({ 
      message: 'Internal server error',
      details: error.message 
    });
  }
} 