import {
  getUPaymentsPayment,
  getUPaymentsPaymentChecks,
  logUPaymentsVerification,
  validateRequestOrigin,
  verifySignedMontageOrder,
} from '../../server/consultationPayments.js';
import { sendMontageOrderEmail } from '../../server/consultationEmail.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (!validateRequestOrigin(req)) {
      return res.status(403).json({ error: 'Request origin is not allowed' });
    }

    const trackId = typeof req.body?.trackId === 'string' ? req.body.trackId : '';
    const reference = typeof req.body?.reference === 'string' ? req.body.reference : '';
    const order = verifySignedMontageOrder(req.body?.orderToken);
    if (!order || order.reference !== reference) {
      return res.status(400).json({ error: 'Invalid payment confirmation' });
    }

    const transaction = await getUPaymentsPayment(trackId);
    const checks = getUPaymentsPaymentChecks(transaction, order, trackId);
    logUPaymentsVerification('montage return', transaction, checks);
    if (!Object.values(checks).every((check) => check === true)) {
      if (transaction?.result !== 'CAPTURED') {
        return res.status(202).json({ paid: false, pending: true });
      }
      return res.status(402).json({ error: 'Payment has not completed' });
    }

    let orderSaved = false;
    let notificationSent = false;
    try {
      ({ orderSaved, notificationSent } = await sendMontageOrderEmail(reference, order));
      console.info('Montage paid-order processing finished:', { orderSaved, notificationSent });
    } catch (error) {
      console.error(
        'Payment was confirmed but the montage order could not be saved or notified:',
        error instanceof Error ? error.message : 'Unknown error',
      );
    }

    return res.status(200).json({
      paid: true,
      orderSaved,
      notificationSent,
      order: {
        ...order,
      },
    });
  } catch (error) {
    console.error('Montage payment confirmation failed:', error instanceof Error ? error.message : 'Unknown error');
    return res.status(503).json({ error: 'Could not confirm payment at this time' });
  }
}
