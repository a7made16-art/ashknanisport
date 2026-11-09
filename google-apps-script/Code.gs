const COMPANY_EMAIL = 'Ashkananisport@gmail.com';
const MAX_EMAIL_FIELD_LENGTH = 50000;

function doPost(event) {
  try {
    const request = JSON.parse(event.postData.contents);
    const expectedSecret = PropertiesService.getScriptProperties().getProperty('NOTIFICATION_SECRET');
    if (!expectedSecret || expectedSecret.length < 32 || !constantTimeEquals(request.secret, expectedSecret)) {
      return jsonResponse({ result: 'error', error: 'Unauthorized' });
    }

    const effectiveUser = Session.getEffectiveUser().getEmail().toLowerCase();
    if (effectiveUser !== COMPANY_EMAIL.toLowerCase()) {
      return jsonResponse({ result: 'error', error: 'Deploy this script using the company Gmail account' });
    }

    const reference = typeof request.reference === 'string' ? request.reference : '';
    const subject = typeof request.subject === 'string' ? request.subject : '';
    const text = typeof request.text === 'string' ? request.text : '';
    const html = typeof request.html === 'string' ? request.html : '';
    if (
      !/^[a-f0-9]{24}$/i.test(reference) ||
      !subject || subject.length > 200 ||
      !text || text.length > MAX_EMAIL_FIELD_LENGTH ||
      !html || html.length > MAX_EMAIL_FIELD_LENGTH
    ) {
      return jsonResponse({ result: 'error', error: 'Invalid email notification' });
    }

    const cache = CacheService.getScriptCache();
    const cacheKey = `email:${reference}`;
    if (cache.get(cacheKey)) return jsonResponse({ result: 'already_sent' });

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      if (cache.get(cacheKey)) return jsonResponse({ result: 'already_sent' });
      if (MailApp.getRemainingDailyQuota() < 1) {
        return jsonResponse({ result: 'error', error: 'Gmail daily sending quota reached' });
      }

      GmailApp.sendEmail(COMPANY_EMAIL, subject, text, {
        htmlBody: html,
        name: 'Ashkanani Sport',
      });
      cache.put(cacheKey, 'sent', 21600);
      return jsonResponse({ result: 'sent' });
    } finally {
      lock.releaseLock();
    }
  } catch (error) {
    console.error('Email notification failed:', error);
    return jsonResponse({ result: 'error', error: 'Could not send email' });
  }
}

function constantTimeEquals(candidate, expected) {
  if (typeof candidate !== 'string' || typeof expected !== 'string') return false;
  let difference = candidate.length ^ expected.length;
  const maxLength = Math.max(candidate.length, expected.length);
  for (let index = 0; index < maxLength; index += 1) {
    difference |= (candidate.charCodeAt(index) || 0) ^ (expected.charCodeAt(index) || 0);
  }
  return difference === 0;
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
