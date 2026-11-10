import {
  getUPaymentsPayment,
  isConfirmedUPaymentsPayment,
  validateRequestOrigin,
  verifySignedBooking,
} from '../../server/consultationPayments.js';

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
    const booking = verifySignedBooking(req.body?.bookingToken);
    if (!booking || booking.reference !== reference) {
      return res.status(400).json({ error: 'Invalid payment confirmation' });
    }

    const transaction = await getUPaymentsPayment(trackId);
    if (!isConfirmedUPaymentsPayment(transaction, booking, trackId)) {
      console.warn('UPayments consultation verification did not match:', {
        resultCaptured: transaction?.result === 'CAPTURED',
        trackIdMatches: transaction?.track_id === trackId,
        orderReferenceMatches: transaction?.merchant_requested_order_id === booking.reference,
        currencyMatches: transaction?.currency_type === 'KWD',
        amountMatches: Number(transaction?.total_price) === booking.service.amount,
      });
      if (transaction?.result !== 'CAPTURED') {
        return res.status(202).json({ paid: false, pending: true });
      }
      return res.status(402).json({ error: 'Payment has not completed' });
    }

    return res.status(200).json({
      paid: true,
      booking: {
        name: booking.name,
        phone: booking.phone,
        serviceId: booking.service.id,
        date: booking.date,
        time: booking.time,
      },
    });
  } catch (error) {
    console.error('Consultation payment confirmation failed:', error instanceof Error ? error.message : 'Unknown error');
    return res.status(503).json({ error: 'Could not confirm payment at this time' });
  }
}
