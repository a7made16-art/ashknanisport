import { timingSafeEqual } from 'node:crypto';
import {
  createUPaymentsSignature,
  getSiteUrl,
  getUPaymentsConfig,
  getUPaymentsPayment,
  isConfirmedUPaymentsPayment,
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

function isValidSignature(received, expected) {
  if (typeof received !== 'string') return false;
  const receivedBytes = Buffer.from(received);
  const expectedBytes = Buffer.from(expected);
  return receivedBytes.length === expectedBytes.length
    && timingSafeEqual(receivedBytes, expectedBytes);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const rawBody = await readRawBody(req);
    const timestamp = req.headers['x-timestamp'];
    const signature = req.headers['x-signature'];
    if (
      typeof timestamp !== 'string'
      || !/^\d{10}$/.test(timestamp)
      || Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp)) > 60
    ) {
      return res.status(401).json({ error: 'Invalid webhook timestamp' });
    }

    const notificationUrl = new URL('/api/consultations/notification', getSiteUrl()).toString();
    const { apiSecret } = getUPaymentsConfig();
    const expected = createUPaymentsSignature(apiSecret, timestamp, 'POST', notificationUrl, rawBody);
    if (!isValidSignature(signature, expected)) {
      return res.status(401).json({ error: 'Invalid webhook signature' });
    }

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

    const transaction = await getUPaymentsPayment(trackId);
    if (!isConfirmedUPaymentsPayment(transaction, paidOrder, trackId)) {
      return res.status(400).json({ error: 'Payment does not match the order' });
    }

    if (booking) await sendBookingEmail(reference, booking);
    else await sendMontageOrderEmail(reference, montageOrder);
    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('UPayments notification processing failed:', error instanceof Error ? error.message : 'Unknown error');
    return res.status(500).json({ error: 'Could not process payment notification' });
  }
}
