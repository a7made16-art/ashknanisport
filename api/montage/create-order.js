import {
  createUPaymentsSignature,
  createBookingReference,
  getSiteUrl,
  getUPaymentsConfig,
  signMontageOrder,
  validateMontageOrder,
  validateRequestOrigin,
  logUPaymentsFailure,
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

    const order = validateMontageOrder(req.body);
    if (!order) return res.status(400).json({ error: 'Invalid match editing order details' });

    const reference = createBookingReference();
    const orderToken = signMontageOrder(order, reference);
    const { apiBase, apiKey, apiSecret } = getUPaymentsConfig();
    const siteUrl = getSiteUrl();
    const callback = new URL('/', siteUrl);
    callback.searchParams.set('montagePayment', 'success');
    callback.searchParams.set('ref', reference);
    const cancel = new URL('/', siteUrl);
    cancel.searchParams.set('montagePayment', 'cancelled');
    cancel.searchParams.set('ref', reference);
    const phoneDigits = order.phone.replace(/\D/g, '');
    const customerMobile = order.phone.trim().startsWith('+') && phoneDigits.length <= 15
      ? `+${phoneDigits}`
      : phoneDigits.length === 8
        ? `+965${phoneDigits}`
        : null;
    const charge = {
      products: [{
        name: `${order.packageTitle}${order.includeLogo ? '' : ' (without company logo)'}`,
        description: `${order.matches.length} match(es) | ${order.sport} | ${order.competition}`,
        price: order.amount,
        quantity: 1,
      }],
      order: {
        id: reference,
        reference,
        description: `Match editing order: ${order.packageTitle}`,
        currency: 'KWD',
        amount: order.amount,
      },
      language: order.language,
      reference: { id: reference },
      customer: {
        name: order.name.slice(0, 50),
        ...(customerMobile ? { mobile: customerMobile } : {}),
      },
      returnUrl: callback.toString(),
      cancelUrl: cancel.toString(),
      notificationUrl: new URL('/api/consultations/notification', siteUrl).toString(),
      customerExtraData: orderToken,
    };
    const body = JSON.stringify(charge);
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const response = await fetch(`${apiBase}/charge`, {
      method: 'POST',
      headers: {
        Authorization: apiKey,
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Timestamp': timestamp,
        'X-Signature': createUPaymentsSignature(apiSecret, timestamp, 'POST', 'charge', body),
      },
      body,
    });

    if (!response.ok) {
      await logUPaymentsFailure('montage charge creation', 'POST /api/v1/charge', response);
      if (response.status === 401) {
        return res.status(502).json({
          code: 'UPAYMENTS_AUTH_FAILED',
          error: 'Payment provider authentication failed. Verify the Production API credentials.',
        });
      }
      return res.status(502).json({
        code: 'UPAYMENTS_CHARGE_FAILED',
        error: 'Could not start UPayments checkout',
      });
    }

    const result = await response.json();
    const checkoutUrl = result.data?.link;
    if (result.status !== true || typeof checkoutUrl !== 'string') {
      console.error('UPayments montage charge response was incomplete');
      return res.status(502).json({ error: 'UPayments returned an incomplete checkout response' });
    }

    return res.status(200).json({ checkoutUrl, orderToken, reference });
  } catch (error) {
    console.error('Montage order creation failed:', error instanceof Error ? error.message : 'Unknown error');
    return res.status(503).json({ error: 'Payment is not configured or is temporarily unavailable' });
  }
}
