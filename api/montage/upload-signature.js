import {
  createCloudinarySignature,
  getCloudinaryConfig,
  getSiteUrl,
  getUPaymentsConfig,
  validateRequestOrigin,
} from '../../server/consultationPayments.js';
import { isGmailNotificationConfigured } from '../../server/consultationEmail.js';

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (!validateRequestOrigin(req)) {
      return res.status(403).json({ error: 'Request origin is not allowed' });
    }
    if (!isGmailNotificationConfigured()) {
      return res.status(503).json({ error: 'Gmail email notifications are not configured' });
    }
    getSiteUrl();
    getUPaymentsConfig();

    const uploadBatchId = typeof req.body?.uploadBatchId === 'string' ? req.body.uploadBatchId : '';
    const imageIndex = req.body?.imageIndex;
    if (!uuidPattern.test(uploadBatchId) || !Number.isInteger(imageIndex) || imageIndex < 0 || imageIndex > 2) {
      return res.status(400).json({ error: 'Invalid image upload request' });
    }

    const { cloudName, apiKey, apiSecret } = getCloudinaryConfig();
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const publicId = `montage-pending/${uploadBatchId}/image-${imageIndex}`;
    const parameters = { overwrite: 'false', public_id: publicId, timestamp };
    const signature = createCloudinarySignature(parameters, apiSecret);

    return res.status(200).json({
      cloudName,
      apiKey,
      timestamp,
      publicId,
      signature,
      overwrite: false,
    });
  } catch (error) {
    console.error('Cloudinary upload signature generation failed:', error instanceof Error ? error.message : 'Unknown error');
    return res.status(503).json({ error: 'Image uploads are not configured' });
  }
}
