import {
  getUPaymentsPayment,
  getUPaymentsPaymentChecks,
  logUPaymentsVerification,
  verifySignedBooking,
  verifySignedMontageOrder,
} from '../../server/consultationPayments.js';
import { sendBookingEmail, sendMontageOrderEmail } from '../../server/consultationEmail.js';

export const config = {
  api: { bodyParser: false },
};

async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString('utf8');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const rawBody = await readRawBody(req);
    let payload;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return res.status(400).json({ error: 'Invalid webhook payload' });
    }

    if (payload.result !== 'CAPTURED') {
      return res.status(200).json({ received: true });
    }

    const booking = verifySignedBooking(payload.trn_udf);
    const montageOrder = booking ? null : verifySignedMontageOrder(payload.trn_udf);
    const paidOrder = booking || montageOrder;
    const trackId = typeof payload.track_id === 'string' ? payload.track_id : '';
    const reference = typeof payload.requested_order_id === 'string'
      ? payload.requested_order_id
      : '';
    if (!paidOrder || paidOrder.reference !== reference) {
      console.error('UPayments webhook did not match a valid consultation or montage order');
      return res.status(400).json({ error: 'Invalid order reference' });
    }

    if (!trackId) {
      return res.status(400).json({ error: 'Missing payment track ID' });
    }

    const transaction = await getUPaymentsPayment(trackId);
    const checks = getUPaymentsPaymentChecks(transaction, paidOrder, trackId);
    logUPaymentsVerification('payment webhook', transaction, checks);
    if (!Object.values(checks).every((check) => check === true)) {
      return res.status(400).json({ error: 'Payment does not match the order' });
    }

    try {
      const processingResult = booking
        ? await sendBookingEmail(reference, booking)
        : await sendMontageOrderEmail(reference, montageOrder);
      console.info('Payment webhook paid-order processing finished:', processingResult);
    } catch (error) {
      console.error(
        'Payment was confirmed but its order could not be saved or notified:',
        error instanceof Error ? error.message : 'Unknown error',
      );
    }
    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('UPayments notification processing failed:', error instanceof Error ? error.message : 'Unknown error');
    return res.status(500).json({ error: 'Could not process payment notification' });
  }
}
