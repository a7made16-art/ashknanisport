import { timingSafeEqual } from 'node:crypto';
import {
  getUPaymentsPayment,
  getUPaymentsPaymentChecks,
  logUPaymentsVerification,
  verifySignedBooking,
  verifySignedMontageOrder,
} from '../../server/consultationPayments.js';
import {
  isGmailNotificationConfigured,
  sendBookingEmail,
  sendMontageOrderEmail,
} from '../../server/consultationEmail.js';

function isAuthorized(req) {
  const expected = process.env.PAYMENT_RECOVERY_SECRET;
  const received = req.headers['x-payment-recovery-secret'];
  if (typeof expected !== 'string' || expected.length < 32 || typeof received !== 'string') {
    return false;
  }

  const expectedBytes = Buffer.from(expected);
  const receivedBytes = Buffer.from(received);
  return expectedBytes.length === receivedBytes.length
    && timingSafeEqual(expectedBytes, receivedBytes);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!isAuthorized(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (!isGmailNotificationConfigured()) {
    return res.status(503).json({ error: 'Email notifications are not configured' });
  }

  const trackId = typeof req.body?.trackId === 'string' ? req.body.trackId : '';
  if (!/^[a-zA-Z0-9_-]{10,80}$/.test(trackId)) {
    return res.status(400).json({ error: 'A valid payment track ID is required' });
  }

  try {
    const transaction = await getUPaymentsPayment(trackId);
    const bookingToken = typeof transaction.customer_extra_data === 'string'
      ? transaction.customer_extra_data
      : '';
    const booking = verifySignedBooking(bookingToken, { allowExpired: true, allowPastDate: true });
    const order = booking ? null : verifySignedMontageOrder(bookingToken, { allowExpired: true });
    const paidOrder = booking || order;
    if (!paidOrder) {
      console.warn('Payment recovery rejected: provider transaction has no valid signed order');
      return res.status(404).json({ error: 'No recoverable order was found for this payment' });
    }

    const checks = getUPaymentsPaymentChecks(transaction, paidOrder, trackId);
    logUPaymentsVerification('admin recovery', transaction, checks);
    if (!Object.values(checks).every((check) => check === true)) {
      return res.status(402).json({ error: 'Payment could not be matched to the order' });
    }

    try {
      const processingResult = booking
        ? await sendBookingEmail(paidOrder.reference, booking)
        : await sendMontageOrderEmail(paidOrder.reference, order);
      if (!processingResult.orderSaved) {
        return res.status(502).json({
          recovered: true,
          orderSaved: false,
          notificationSent: false,
          error: 'Payment is verified; the paid order could not be saved',
        });
      }
      if (!processingResult.notificationSent) {
        return res.status(502).json({
          recovered: true,
          orderSaved: true,
          notificationSent: false,
          error: 'Payment is verified and saved; retry the company email notification',
        });
      }
      console.info('Recovered paid-order processing finished:', processingResult);
    } catch (error) {
      console.error(
        'Recovered payment was verified but its order could not be saved or notified:',
        error instanceof Error ? error.message : 'Unknown error',
      );
      return res.status(502).json({
        recovered: true,
        orderSaved: false,
        notificationSent: false,
        error: 'Payment is verified; retry email notification or contact support',
      });
    }

    console.info('Paid order recovered and company email notification accepted:', {
      orderType: booking ? 'consultation' : 'montage',
      notificationSent: true,
    });
    return res.status(200).json({
      recovered: true,
      orderType: booking ? 'consultation' : 'montage',
      orderSaved: true,
      notificationSent: true,
    });
  } catch (error) {
    console.error(
      'Payment recovery failed:',
      error instanceof Error ? error.message : 'Unknown error',
    );
    return res.status(503).json({ error: 'Could not verify or recover this payment' });
  }
}
