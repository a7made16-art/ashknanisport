import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

const services = {
  1: {
    amount: 20,
    ar: 'استشاره فنية للاعبين او المدربين',
    en: 'Technical consultation for players or coaches',
  },
  2: {
    amount: 15,
    ar: 'اقتراحات مستقبلية للاعب او المدرب',
    en: 'Future suggestions for players or coaches',
  },
  3: {
    amount: 10,
    ar: 'استشاره للأمور نفسيه للشخص الرياضي',
    en: 'Psychological consultation for athletes',
  },
  4: {
    amount: 30,
    ar: 'استشاره كيفيه أفتتاح أكاديمية رياضية',
    en: 'Consultation on opening a sports academy',
  },
  5: {
    amount: 30,
    ar: 'استشاره عن وكلاء اللاعبين و التسويق الرياضي',
    en: 'Consultation on player agents and sports marketing',
  },
  6: {
    amount: 30,
    ar: 'الثقافه الإداريه للإداري الرياضي',
    en: 'Administrative culture for sports administrators',
  },
  7: {
    amount: 0,
    ar: 'الحجز للتوقيع أو لحضور اجتماع رسمي للاعبين والمدربين المنضمين إلينا',
    en: 'Booking for signing or attending an official meeting',
  },
};

const defaultCloudinaryCloudName = 'vnrn0edq';
const defaultCloudinaryApiKey = '319234268741727';

const appointmentTimes = {
  ar: {
    regular: [
      '10:00 صباحاً',
      '11:00 صباحاً',
      '12:00 ظهراً',
      '5:00 - 6:00 مساءً',
      '6:00 - 7:00 مساءً',
      '7:00 - 8:00 مساءً',
      '8:00 - 9:00 مساءً',
    ],
    saturday: [
      '4:00 - 5:00 مساءً',
      '5:00 - 6:00 مساءً',
      '6:00 - 7:00 مساءً',
      '7:00 - 8:00 مساءً',
      '8:00 - 9:00 مساءً',
    ],
  },
  en: {
    regular: [
      '10:00 AM',
      '11:00 AM',
      '12:00 PM',
      '5:00 - 6:00 PM',
      '6:00 - 7:00 PM',
      '7:00 - 8:00 PM',
      '8:00 - 9:00 PM',
    ],
    saturday: [
      '4:00 - 5:00 PM',
      '5:00 - 6:00 PM',
      '6:00 - 7:00 PM',
      '7:00 - 8:00 PM',
      '8:00 - 9:00 PM',
    ],
  },
};

export function getService(serviceId, language) {
  const service = services[serviceId];
  if (!service) return null;
  return {
    id: Number(serviceId),
    title: service[language],
    amount: service.amount,
  };
}

export function validateBooking(input) {
  const language = input?.language === 'en' ? 'en' : input?.language === 'ar' ? 'ar' : null;
  const service = getService(input?.serviceId, language);
  const name = typeof input?.name === 'string' ? input.name.trim() : '';
  const phone = typeof input?.phone === 'string' ? input.phone.trim() : '';
  const date = typeof input?.date === 'string' ? input.date : '';
  const time = typeof input?.time === 'string' ? input.time.trim() : '';

  if (
    !language ||
    !service ||
    service.amount <= 0 ||
    name.length < 1 ||
    name.length > 120 ||
    !/^[+()\d\s-]{8,20}$/.test(phone) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    !time ||
    time.length > 40
  ) {
    return null;
  }

  const parsedDate = new Date(`${date}T00:00:00Z`);
  if (
    Number.isNaN(parsedDate.getTime()) ||
    parsedDate.toISOString().slice(0, 10) !== date ||
    parsedDate.getUTCDay() === 4 ||
    parsedDate.getUTCDay() === 5
  ) {
    return null;
  }

  const dayTimes = parsedDate.getUTCDay() === 6
    ? appointmentTimes[language].saturday
    : appointmentTimes[language].regular;
  if (!dayTimes.includes(time)) return null;

  const kuwaitDateParts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kuwait',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const todayInKuwait = `${kuwaitDateParts.find((part) => part.type === 'year')?.value}-${kuwaitDateParts.find((part) => part.type === 'month')?.value}-${kuwaitDateParts.find((part) => part.type === 'day')?.value}`;
  if (date < todayInKuwait) return null;

  if (date === todayInKuwait) {
    const nowInKuwait = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kuwait',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(new Date());
    const currentHour = Number(nowInKuwait.find((part) => part.type === 'hour')?.value);
    const currentMinute = Number(nowInKuwait.find((part) => part.type === 'minute')?.value);
    const timeParts = time.match(/^(\d{1,2}):(\d{2})/);
    if (timeParts) {
      let hour = Number(timeParts[1]);
      const minute = Number(timeParts[2]);
      if ((time.includes('مساءً') || time.includes('PM')) && hour < 12) hour += 12;
      if ((time.includes('صباحاً') || time.includes('AM')) && hour === 12) hour = 0;
      if (hour < currentHour || (hour === currentHour && minute <= currentMinute)) return null;
    }
  }

  return { language, service, name, phone, date, time };
}

export function createBookingReference() {
  return randomBytes(12).toString('hex');
}

export function signBooking(booking, reference) {
  const payload = Buffer.from(JSON.stringify({
    language: booking.language,
    serviceId: booking.service.id,
    name: booking.name,
    phone: booking.phone,
    date: booking.date,
    time: booking.time,
    reference,
    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
  })).toString('base64url');
  const signature = createHmac('sha256', getSigningSecret()).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

export function verifySignedBooking(token) {
  if (typeof token !== 'string') return null;
  const [payload, signature, extra] = token.split('.');
  if (!payload || !signature || extra) return null;

  const expected = createHmac('sha256', getSigningSecret()).update(payload).digest();
  let actual;
  try {
    actual = Buffer.from(signature, 'base64url');
  } catch {
    return null;
  }
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;

  try {
    const booking = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (
      typeof booking.reference !== 'string' ||
      typeof booking.expiresAt !== 'number' ||
      booking.expiresAt < Date.now()
    ) {
      return null;
    }
    const validated = validateBooking(booking);
    if (!validated) return null;
    return { ...validated, reference: booking.reference };
  } catch {
    return null;
  }
}

const montagePackages = {
  match1: { title: 'مباراة واحدة / 1 match', amount: 6, matchCount: 1 },
  matches2: { title: 'مباراتان / 2 matches', amount: 12, matchCount: 2 },
  matches3: { title: '3 مباريات / 3 matches', amount: 20, matchCount: 3 },
  matches4: { title: '4 مباريات / 4 matches', amount: 26, matchCount: 4 },
};

function boundedText(value, maxLength) {
  return typeof value === 'string' && value.trim().length > 0 && value.trim().length <= maxLength
    ? value.trim()
    : null;
}

export function validateMontageOrder(input) {
  const language = input?.language === 'en' ? 'en' : input?.language === 'ar' ? 'ar' : null;
  const packageId = typeof input?.packageId === 'string' ? input.packageId : '';
  const selectedPackage = montagePackages[packageId];
  const name = boundedText(input?.name, 120);
  const phone = boundedText(input?.phone, 30);
  const birthYear = Number(input?.birthYear);
  const sport = boundedText(input?.sport, 100);
  const competition = boundedText(input?.competition, 150);
  const matches = Array.isArray(input?.matches) ? input.matches : [];
  const notes = typeof input?.notes === 'string' ? input.notes.trim().slice(0, 1000) : '';
  const uploadBatchId = typeof input?.uploadBatchId === 'string' ? input.uploadBatchId : '';
  const photos = Array.isArray(input?.photos)
    ? input.photos
    : [];

  if (
    !language || !selectedPackage || !name ||
    !/^[+()\d\s-]{8,30}$/.test(phone || '') ||
    !Number.isInteger(birthYear) || birthYear < 1900 || birthYear > new Date().getFullYear() ||
    !sport || !competition || matches.length !== selectedPackage.matchCount ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uploadBatchId) ||
    photos.length !== 3 ||
    typeof input?.includeLogo !== 'boolean'
  ) return null;

  const validatedMatches = matches.map((match) => {
    const matchDate = typeof match?.matchDate === 'string' ? match.matchDate : '';
    const firstTeam = boundedText(match?.firstTeam, 100);
    const secondTeam = boundedText(match?.secondTeam, 100);
    const matchVideoUrl = typeof match?.matchVideoUrl === 'string' ? match.matchVideoUrl.trim() : '';
    if (!firstTeam || !secondTeam || !/^\d{4}-\d{2}-\d{2}$/.test(matchDate)) return null;
    const parsedDate = new Date(`${matchDate}T00:00:00Z`);
    if (Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== matchDate) return null;
    try {
      const url = new URL(matchVideoUrl);
      if (url.protocol !== 'https:') return null;
    } catch {
      return null;
    }
    return { matchDate, firstTeam, secondTeam, matchVideoUrl };
  });
  if (validatedMatches.some((match) => !match)) return null;

  const validatedPhotos = photos.map((photo, index) => {
    const name = boundedText(photo?.name, 180);
    const publicId = `montage-pending/${uploadBatchId}/image-${index}`;
    if (photo?.publicId !== publicId || !name || typeof photo?.secureUrl !== 'string') return null;
    try {
      const url = new URL(photo.secureUrl);
      const expectedCloudName = process.env.CLOUDINARY_CLOUD_NAME || defaultCloudinaryCloudName;
      const uploadPath = url.pathname.split('/image/upload/')[1];
      const assetPath = uploadPath?.replace(/^v\d+\//, '');
      if (
        url.protocol !== 'https:' ||
        url.hostname !== 'res.cloudinary.com' ||
        !expectedCloudName ||
        !url.pathname.startsWith(`/${expectedCloudName}/image/upload/`) ||
        !assetPath ||
        !new RegExp(`^${publicId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:\\.[a-z0-9]{2,5})?$`, 'i').test(assetPath)
      ) return null;
      return { name, publicId, secureUrl: url.toString() };
    } catch {
      return null;
    }
  });
  if (validatedPhotos.some((photo) => !photo)) return null;

  return {
    type: 'montage',
    language,
    packageId,
    packageTitle: selectedPackage.title,
    baseAmount: selectedPackage.amount,
    amount: selectedPackage.amount + (input.includeLogo ? 0 : 3),
    name,
    phone,
    birthYear,
    sport,
    competition,
    matches: validatedMatches,
    uploadBatchId,
    photos: validatedPhotos,
    includeLogo: input.includeLogo,
    notes,
  };
}

export function signMontageOrder(order, reference) {
  const payload = Buffer.from(JSON.stringify({
    ...order,
    reference,
    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
  })).toString('base64url');
  const signature = createHmac('sha256', getSigningSecret()).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

export function verifySignedMontageOrder(token) {
  if (typeof token !== 'string') return null;
  const [payload, signature, extra] = token.split('.');
  if (!payload || !signature || extra) return null;

  const expected = createHmac('sha256', getSigningSecret()).update(payload).digest();
  const actual = Buffer.from(signature, 'base64url');
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;

  try {
    const order = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (typeof order.reference !== 'string' || typeof order.expiresAt !== 'number' || order.expiresAt < Date.now()) {
      return null;
    }
    const validated = validateMontageOrder(order);
    if (!validated) return null;
    return { ...validated, reference: order.reference };
  } catch {
    return null;
  }
}

export function getUPaymentsConfig() {
  const mode = process.env.UPAYMENTS_MODE;
  const apiKey = process.env.UPAYMENTS_API_KEY;
  const apiSecret = process.env.UPAYMENTS_API_SECRET;
  if (mode !== 'sandbox' && mode !== 'live') {
    throw new Error('UPAYMENTS_MODE must be set to sandbox or live');
  }
  if (!apiKey || !apiSecret) throw new Error('UPayments credentials are not configured');

  return {
    apiBase: mode === 'sandbox'
      ? 'https://sandboxapi.upayments.com/api/v1'
      : 'https://uapi.upayments.com/api/v1',
    apiKey,
    apiSecret,
  };
}

export function getSiteUrl() {
  const value = process.env.SITE_URL;
  if (!value) throw new Error('SITE_URL is not configured');
  const url = new URL(value);
  if (url.protocol !== 'https:' && url.hostname !== 'localhost') {
    throw new Error('SITE_URL must use HTTPS');
  }
  return url.origin;
}

export function validateRequestOrigin(req) {
  const origin = req.headers.origin;
  if (typeof origin !== 'string') return false;
  try {
    return new URL(origin).origin === getSiteUrl();
  } catch {
    return false;
  }
}

export function createUPaymentsSignature(apiSecret, timestamp, method, path, body = '') {
  return createHmac('sha256', apiSecret)
    .update(`${timestamp}${method.toUpperCase()}${path}${body}`)
    .digest('base64');
}

export function getCloudinaryConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || defaultCloudinaryCloudName;
  const apiKey = process.env.CLOUDINARY_API_KEY || defaultCloudinaryApiKey;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !/^[a-z0-9-]+$/i.test(cloudName)) {
    throw new Error('CLOUDINARY_CLOUD_NAME is not configured correctly');
  }
  if (!apiKey || !apiSecret) throw new Error('Cloudinary credentials are not configured');
  return { cloudName, apiKey, apiSecret };
}

export function createCloudinarySignature(parameters, apiSecret) {
  const canonical = Object.entries(parameters)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .sort(([first], [second]) => first.localeCompare(second))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');
  return createHash('sha1').update(`${canonical}${apiSecret}`).digest('hex');
}

export async function getUPaymentsPayment(trackId) {
  if (typeof trackId !== 'string' || !/^[a-zA-Z0-9_-]{10,80}$/.test(trackId)) {
    throw new Error('Invalid UPayments track ID');
  }
  const { apiBase, apiKey, apiSecret } = getUPaymentsConfig();
  const path = `get-payment-status/${encodeURIComponent(trackId)}`;
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const response = await fetch(`${apiBase}/${path}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'X-Timestamp': timestamp,
      'X-Signature': createUPaymentsSignature(apiSecret, timestamp, 'GET', path),
    },
  });
  if (!response.ok) {
    console.error('UPayments status lookup failed:', response.status);
    throw new Error('UPayments could not verify the payment');
  }
  const data = await response.json();
  if (data.status !== true || !data.data?.transaction) {
    throw new Error('UPayments returned an incomplete payment status');
  }
  return data.data.transaction;
}

export function isConfirmedUPaymentsPayment(transaction, booking, trackId) {
  return transaction?.result === 'CAPTURED'
    && transaction?.track_id === trackId
    && transaction?.merchant_requested_order_id === booking.reference
    && transaction?.currency_type === 'KWD'
    && Number(transaction?.total_price) === (booking.amount ?? booking.service.amount);
}

function getSigningSecret() {
  const secret = process.env.BOOKING_SIGNING_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('BOOKING_SIGNING_SECRET must contain at least 32 characters');
  }
  return secret;
}
