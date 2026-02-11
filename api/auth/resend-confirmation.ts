// API endpoint for resending AWS Cognito confirmation code
// Vercel serverless function

import { VercelRequest, VercelResponse } from '@vercel/node';
import {
  CognitoIdentityProviderClient,
  ResendConfirmationCodeCommand,
} from '@aws-sdk/client-cognito-identity-provider';

// AWS Cognito configuration
const cognitoConfig = {
  region: process.env.AWS_REGION || 'eu-west-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
};

const client = new CognitoIdentityProviderClient(cognitoConfig);
const clientId = process.env.AWS_COGNITO_CLIENT_ID || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const command = new ResendConfirmationCodeCommand({
      ClientId: clientId,
      Username: email,
    });

    const result = await client.send(command);

    res.status(200).json({
      codeDeliveryDetails: result.CodeDeliveryDetails,
      error: null,
    });
  } catch (error: unknown) {
    console.error('Cognito resend confirmation error:', error);

    let errorMessage = 'Failed to resend confirmation code';
    const errName = error instanceof Error ? error.name : undefined;
    const errMessage = error instanceof Error ? error.message : undefined;
    if (errName === 'InvalidParameterException') {
      errorMessage = 'User is already confirmed';
    } else if (errName === 'UserNotFoundException') {
      errorMessage = 'User not found';
    } else if (errName === 'LimitExceededException') {
      errorMessage = 'Too many requests. Please try again later.';
    } else if (errMessage) {
      errorMessage = errMessage;
    }

    res.status(500).json({ error: errorMessage });
  }
}
