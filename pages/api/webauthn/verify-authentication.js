import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import { connectToDatabase } from '../../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { db } = await connectToDatabase();
    const { credential } = req.body;

    // Get the stored challenge and credential
    const [challengeDoc, credentialDoc] = await Promise.all([
      db.collection('webauthn').findOne({ type: 'challenge' }),
      db.collection('webauthn').findOne({ type: 'credential' })
    ]);

    if (!challengeDoc || !credentialDoc) {
      return res.status(400).json({ message: 'Missing challenge or credential' });
    }

    // Verify the authentication
    const verification = await verifyAuthenticationResponse({
      response: credential,
      expectedChallenge: challengeDoc.challenge,
      expectedOrigin: process.env.NEXT_PUBLIC_DOMAIN || 'http://localhost:3000',
      expectedRPID: process.env.NEXT_PUBLIC_DOMAIN || 'localhost',
      authenticator: credentialDoc.credential,
    });

    if (verification.verified) {
      // Clear the challenge
      await db.collection('webauthn').deleteOne({ type: 'challenge' });
      return res.status(200).json({ verified: true });
    }

    return res.status(400).json({ message: 'Verification failed' });
  } catch (error) {
    console.error('Verification error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 