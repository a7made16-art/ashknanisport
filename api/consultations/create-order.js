import {
  createUPaymentsSignature,
  createBookingReference,
  getUPaymentsConfig,
  getService,
  getSiteUrl,
  signBooking,
  validateBooking,
  validateRequestOrigin,
} from '../../server/consultationPayments.js';
import { isGmailNotificationConfigured } from '../../server/consultationEmail.js';

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

    const booking = validateBooking(req.body);
    if (!booking) return res.status(400).json({ error: 'Invalid booking details' });

    const reference = createBookingReference();
    const bookingToken = signBooking(booking, reference);
    const { apiBase, apiKey, apiSecret } = getUPaymentsConfig();
    const siteUrl = getSiteUrl();
    const callback = new URL('/', siteUrl);
    callback.searchParams.set('consultationPayment', 'success');
    callback.searchParams.set('ref', reference);
    const cancel = new URL('/', siteUrl);
    cancel.searchParams.set('consultationPayment', 'cancelled');
    cancel.searchParams.set('ref', reference);

    const service = getService(booking.service.id, booking.language);
    const phoneDigits = booking.phone.replace(/\D/g, '');
    const customerMobile = booking.phone.trim().startsWith('+') && phoneDigits.length <= 15
      ? `+${phoneDigits}`
      : phoneDigits.length === 8
        ? `+965${phoneDigits}`
        : null;
    const charge = {
      products: [{
        name: service.title,
        description: `${service.title} - ${booking.date} ${booking.time}`,
        price: service.amount,
        quantity: 1,
      }],
      order: {
        id: reference,
        reference,
        description: `${service.title} - ${booking.date} ${booking.time}`,
        currency: 'KWD',
        amount: service.amount,
      },
      language: booking.language,
      reference: { id: reference },
      customer: {
        name: booking.name.slice(0, 50),
        ...(customerMobile ? { mobile: customerMobile } : {}),
      },
      returnUrl: callback.toString(),
      cancelUrl: cancel.toString(),
      notificationUrl: new URL('/api/consultations/notification', siteUrl).toString(),
      customerExtraData: bookingToken,
    };
    const body = JSON.stringify(charge);
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const upaymentsResponse = await fetch(`${apiBase}/charge`, {
      method: 'POST',
      headers: {
        Authorization: apiKey,
        'Content-Type': 'application/json',
        'X-Timestamp': timestamp,
        'X-Signature': createUPaymentsSignature(apiSecret, timestamp, 'POST', 'charge', body),
      },
      body,
    });

    if (!upaymentsResponse.ok) {
      console.error('UPayments charge creation failed:', upaymentsResponse.status, await upaymentsResponse.text());
      return res.status(502).json({ error: 'Could not start UPayments checkout' });
    }

    const result = await upaymentsResponse.json();
    const checkoutUrl = result.data?.link;
    if (result.status !== true || typeof checkoutUrl !== 'string') {
      console.error('UPayments charge response was incomplete');
      return res.status(502).json({ error: 'UPayments returned an incomplete checkout response' });
    }

    return res.status(200).json({ checkoutUrl, bookingToken, reference });
  } catch (error) {
    console.error('Consultation order creation failed:', error instanceof Error ? error.message : 'Unknown error');
    return res.status(503).json({ error: 'Payment is not configured or is temporarily unavailable' });
  }
}
