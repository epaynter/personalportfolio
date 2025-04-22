import { generateAuthenticationOptions } from '@simplewebauthn/server';
import { connectToDatabase } from '../../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { db } = await connectToDatabase();
    
    // Get the stored credential
    const credentialDoc = await db.collection('webauthn').findOne({ type: 'credential' });
    if (!credentialDoc) {
      return res.status(400).json({ message: 'No credential found' });
    }

    // Generate authentication options
    const options = await generateAuthenticationOptions({
      rpID: process.env.NEXT_PUBLIC_DOMAIN || 'localhost',
      allowCredentials: [{
        id: credentialDoc.credential.credentialID,
        type: 'public-key',
        transports: ['internal'],
      }],
      userVerification: 'required',
    });

    // Store the challenge
    await db.collection('webauthn').updateOne(
      { type: 'challenge' },
      { $set: { challenge: options.challenge } },
      { upsert: true }
    );

    return res.status(200).json(options);
  } catch (error) {
    console.error('Authentication options error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 