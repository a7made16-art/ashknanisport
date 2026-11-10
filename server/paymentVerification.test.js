import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { afterEach, beforeEach, test } from 'node:test';
import recoveryHandler from '../api/admin/recover-payment.js';
import consultationHandler from '../api/consultations/verify-payment.js';
import montageHandler from '../api/montage/verify-payment.js';
import {
  createBookingReference,
  getUPaymentsPaymentChecks,
  signBooking,
  signMontageOrder,
  validateBooking,
  validateMontageOrder,
} from './consultationPayments.js';

const originalFetch = globalThis.fetch;
const originalEnv = { ...process.env };

beforeEach(() => {
  process.env.BOOKING_SIGNING_SECRET = 'test-signing-secret-with-at-least-32-characters';
  process.env.SITE_URL = 'https://example.test';
  process.env.UPAYMENTS_MODE = 'sandbox';
  process.env.UPAYMENTS_API_KEY = 'test-api-key';
  process.env.UPAYMENTS_API_SECRET = 'test-api-secret';
  process.env.GOOGLE_APPS_SCRIPT_URL = 'https://script.google.test/exec';
  process.env.GOOGLE_APPS_SCRIPT_SECRET = 'test-apps-script-secret-with-32-characters';
  process.env.PAYMENT_RECOVERY_SECRET = 'test-recovery-secret-with-at-least-32-characters';
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  for (const key of Object.keys(process.env)) {
    if (!(key in originalEnv)) delete process.env[key];
  }
  Object.assign(process.env, originalEnv);
});

function createResponse(payload) {
  return {
    ok: true,
    status: 200,
    json: async () => payload,
  };
}

function createResponseRecorder() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
    setHeader() {},
  };
}

function mockExternalServices(transaction, notificationResponse = { result: 'sent', saved: true }) {
  const requests = [];
  globalThis.fetch = async (url, options) => {
    requests.push({ url: String(url), options });
    if (String(url).includes('/get-payment-status/')) {
      return createResponse({ status: true, data: { transaction } });
    }
    if (String(url) === process.env.GOOGLE_APPS_SCRIPT_URL) {
      return createResponse(notificationResponse);
    }
    throw new Error('Unexpected external request in payment test');
  };
  return requests;
}

test('consultation return confirms a captured payment using requested_order_id and sends the company email', async () => {
  const reference = createBookingReference();
  const booking = validateBooking({
    language: 'ar',
    serviceId: 1,
    name: 'Test Customer',
    phone: '+96512345678',
    date: '2030-01-08',
    time: '10:00 صباحاً',
  });
  assert.ok(booking);
  const bookingToken = signBooking(booking, reference);
  const trackId = '1234567890_consult';
  const requests = mockExternalServices({
    result: 'CAPTURED',
    track_id: trackId,
    requested_order_id: reference,
    total_price: '20.000',
    currency_type: 'KWD',
  });
  const response = createResponseRecorder();

  await consultationHandler({
    method: 'POST',
    headers: { origin: process.env.SITE_URL },
    body: { trackId, reference, bookingToken },
  }, response);

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.paid, true);
  assert.equal(response.body.orderSaved, true);
  assert.equal(response.body.notificationSent, true);
  assert.equal(requests.length, 2);
  assert.equal(requests[0].options.method, 'GET');
  assert.equal(requests[1].url, process.env.GOOGLE_APPS_SCRIPT_URL);
  const notification = JSON.parse(requests[1].options.body);
  assert.equal(notification.order.type, 'consultation');
  assert.equal(notification.order.paymentStatus, 'paid');
  assert.equal(notification.order.paymentReference, reference);
  assert.equal('customerEmail' in notification.order, false);
});

test('montage return confirms a captured payment using merchant_requested_order_id and sends the company email', async () => {
  const reference = createBookingReference();
  const uploadBatchId = '68b5c112-3e94-4f61-a26b-9876543210ab';
  const order = validateMontageOrder({
    language: 'ar',
    packageId: 'match1',
    name: 'Test Customer',
    phone: '+96512345678',
    birthYear: 2000,
    sport: 'Football',
    competition: 'League',
    matches: [{
      firstTeam: 'Team A',
      secondTeam: 'Team B',
      matchDate: '2030-01-08',
      matchVideoUrl: 'https://example.test/match',
    }],
    uploadBatchId,
    photos: [0, 1, 2].map((index) => ({
      name: `Photo ${index + 1}`,
      publicId: `montage-pending/${uploadBatchId}/image-${index}`,
      secureUrl: `https://res.cloudinary.com/vnrn0edq/image/upload/v123/montage-pending/${uploadBatchId}/image-${index}.jpg`,
    })),
    includeLogo: true,
  });
  assert.ok(order);
  const orderToken = signMontageOrder(order, reference);
  const trackId = '1234567890_montage';
  const requests = mockExternalServices({
    result: 'CAPTURED',
    track_id: trackId,
    merchant_requested_order_id: reference,
    total_price: '6.000',
    currency_type: 'KWD',
  });
  const response = createResponseRecorder();

  await montageHandler({
    method: 'POST',
    headers: { origin: process.env.SITE_URL },
    body: { trackId, reference, orderToken },
  }, response);

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.paid, true);
  assert.equal(response.body.orderSaved, true);
  assert.equal(response.body.notificationSent, true);
  assert.equal(requests.length, 2);
  assert.equal(requests[0].options.method, 'GET');
  assert.equal(requests[1].url, process.env.GOOGLE_APPS_SCRIPT_URL);
  const notification = JSON.parse(requests[1].options.body);
  assert.equal(notification.order.type, 'montage');
  assert.equal(notification.order.paymentStatus, 'paid');
  assert.equal(notification.order.paymentReference, reference);
  assert.equal('customerEmail' in notification.order, false);
});

test('a company email failure does not undo a verified payment or saved order', async () => {
  const reference = createBookingReference();
  const booking = validateBooking({
    language: 'ar',
    serviceId: 1,
    name: 'Test Customer',
    phone: '+96512345678',
    date: '2030-01-08',
    time: '10:00 صباحاً',
  });
  assert.ok(booking);
  const bookingToken = signBooking(booking, reference);
  const trackId = '1234567890_consult';
  mockExternalServices({
    result: 'CAPTURED',
    track_id: trackId,
    requested_order_id: reference,
    total_price: '20.000',
    currency_type: 'KWD',
  }, {
    result: 'error',
    saved: true,
    stage: 'email',
    error: 'Gmail daily sending quota reached',
  });
  const response = createResponseRecorder();

  await consultationHandler({
    method: 'POST',
    headers: { origin: process.env.SITE_URL },
    body: { trackId, reference, bookingToken },
  }, response);

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.paid, true);
  assert.equal(response.body.orderSaved, true);
  assert.equal(response.body.notificationSent, false);
});

test('a paid order is reported as unsaved when the spreadsheet save fails', async () => {
  const reference = createBookingReference();
  const booking = validateBooking({
    language: 'ar',
    serviceId: 1,
    name: 'Test Customer',
    phone: '+96512345678',
    date: '2030-01-08',
    time: '10:00 صباحاً',
  });
  assert.ok(booking);
  const bookingToken = signBooking(booking, reference);
  const trackId = '1234567890_consult';
  mockExternalServices({
    result: 'CAPTURED',
    track_id: trackId,
    requested_order_id: reference,
    total_price: '20.000',
    currency_type: 'KWD',
  }, {
    result: 'error',
    saved: false,
    stage: 'save',
    error: 'Could not save order',
  });
  const response = createResponseRecorder();

  await consultationHandler({
    method: 'POST',
    headers: { origin: process.env.SITE_URL },
    body: { trackId, reference, bookingToken },
  }, response);

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.paid, true);
  assert.equal(response.body.orderSaved, false);
  assert.equal(response.body.notificationSent, false);
});

test('payment checks reject mismatched references, tracks, status, currency, or exact amount', () => {
  const booking = { reference: 'expected-reference', service: { amount: 20 } };
  const validTransaction = {
    result: 'CAPTURED',
    track_id: '1234567890',
    merchant_requested_order_id: booking.reference,
    total_price: '20.000',
    currency_type: 'KWD',
  };

  assert.deepEqual(
    getUPaymentsPaymentChecks(validTransaction, booking, '1234567890'),
    {
      resultCaptured: true,
      trackIdMatches: true,
      requestedOrderIdMatches: true,
      currencyMatches: true,
      amountMatches: true,
    },
  );
  assert.deepEqual(
    getUPaymentsPaymentChecks({
      ...validTransaction,
      result: 'PENDING',
      track_id: 'wrong-track',
      requested_order_id: 'other-reference',
      currency_type: 'USD',
      total_price: '20.001',
    }, booking, '1234567890'),
    {
      resultCaptured: false,
      trackIdMatches: false,
      requestedOrderIdMatches: false,
      currencyMatches: false,
      amountMatches: false,
    },
  );
});

test('admin recovery re-verifies an older captured payment and sends no new charge', async () => {
  const reference = createBookingReference();
  const expiredPayload = Buffer.from(JSON.stringify({
    language: 'ar',
    serviceId: 1,
    name: 'Test Customer',
    phone: '+96512345678',
    date: '2020-01-08',
    time: '10:00 صباحاً',
    reference,
    expiresAt: Date.now() - 1000,
  })).toString('base64url');
  const signature = createHmac('sha256', process.env.BOOKING_SIGNING_SECRET)
    .update(expiredPayload)
    .digest('base64url');
  const trackId = '1234567890_recovery';
  const requests = mockExternalServices({
    result: 'CAPTURED',
    track_id: trackId,
    merchant_requested_order_id: reference,
    total_price: '20.000',
    currency_type: 'KWD',
    customer_extra_data: `${expiredPayload}.${signature}`,
  });
  const response = createResponseRecorder();

  await recoveryHandler({
    method: 'POST',
    headers: {
      'x-payment-recovery-secret': process.env.PAYMENT_RECOVERY_SECRET,
    },
    body: { trackId },
  }, response);

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.recovered, true);
  assert.equal(response.body.orderSaved, true);
  assert.equal(response.body.notificationSent, true);
  assert.equal(requests.length, 2);
  assert.equal(requests[0].options.method, 'GET');
  assert.equal(requests[1].url, process.env.GOOGLE_APPS_SCRIPT_URL);
});
