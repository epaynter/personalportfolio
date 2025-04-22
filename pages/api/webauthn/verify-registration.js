import { verifyRegistrationResponse } from '@simplewebauthn/server';
import { connectToDatabase } from '../../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { db } = await connectToDatabase();
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ message: 'No credential provided' });
    }

    // Get the stored challenge
    const challengeDoc = await db.collection('webauthn').findOne({ type: 'challenge' });
    if (!challengeDoc) {
      return res.status(400).json({ message: 'No challenge found' });
    }

    // Verify the registration
    const verification = await verifyRegistrationResponse({
      response: credential,
      expectedChallenge: challengeDoc.challenge,
      expectedOrigin: process.env.NEXT_PUBLIC_DOMAIN || 'http://localhost:3000',
      expectedRPID: process.env.NEXT_PUBLIC_DOMAIN || 'localhost',
    });

    if (verification.verified) {
      // Store the credential
      await db.collection('webauthn').updateOne(
        { type: 'credential' },
        { $set: { credential: verification.registrationInfo } },
        { upsert: true }
      );

      // Clear the challenge
      await db.collection('webauthn').deleteOne({ type: 'challenge' });

      return res.status(200).json({ verified: true });
    }

    return res.status(400).json({ message: 'Verification failed' });
  } catch (error) {
    console.error('Verification error:', error);
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