const COMPANY_EMAIL = 'Ashkananisport@gmail.com';
const MAX_EMAIL_FIELD_LENGTH = 50000;
const ORDER_SHEET_NAME = 'Paid Orders';
const ORDER_SHEET_HEADERS = [
  'Payment reference',
  'Order type',
  'Payment status',
  'Saved at',
  'Amount (KWD)',
  'Order details (JSON)',
  'Company email status',
  'Email sent at',
];

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
    const order = request.order;
    if (
      !/^[a-f0-9]{24}$/i.test(reference) ||
      !subject || subject.length > 200 ||
      !text || text.length > MAX_EMAIL_FIELD_LENGTH ||
      !html || html.length > MAX_EMAIL_FIELD_LENGTH ||
      !isValidPaidOrder(order, reference)
    ) {
      return jsonResponse({ result: 'error', error: 'Invalid paid order notification' });
    }

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      const sheet = getOrCreateOrderSheet();
      const row = savePaidOrder(sheet, reference, order);
      const properties = PropertiesService.getScriptProperties();
      const sentPropertyKey = `SENT_EMAIL_${reference}`;
      if (properties.getProperty(sentPropertyKey) || sheet.getRange(row, 7).getValue() === 'sent') {
        sheet.getRange(row, 7).setValue('sent');
        return jsonResponse({ result: 'already_sent', saved: true, notificationSent: true });
      }

      if (MailApp.getRemainingDailyQuota() < 1) {
        return jsonResponse({
          result: 'error',
          saved: true,
          stage: 'email',
          error: 'Gmail daily sending quota reached',
        });
      }

      try {
        GmailApp.sendEmail(COMPANY_EMAIL, subject, text, {
          htmlBody: html,
          name: 'Ashkanani Sport',
        });
      } catch (error) {
        console.error('Company email delivery failed');
        return jsonResponse({
          result: 'error',
          saved: true,
          stage: 'email',
          error: 'Company email delivery failed',
        });
      }
      properties.setProperty(sentPropertyKey, new Date().toISOString());
      sheet.getRange(row, 7, 1, 2).setValues([['sent', new Date()]]);
      return jsonResponse({ result: 'sent', saved: true, notificationSent: true });
    } finally {
      lock.releaseLock();
    }
  } catch (error) {
    console.error('Paid order processing failed');
    return jsonResponse({
      result: 'error',
      saved: false,
      stage: 'save',
      error: 'Could not save the paid order or notify the company',
    });
  }
}

function isValidPaidOrder(order, reference) {
  if (!order || typeof order !== 'object' || Array.isArray(order)) return false;
  if (order.type !== 'consultation' && order.type !== 'montage') return false;
  if (order.paymentStatus !== 'paid' || order.paymentReference !== reference) return false;
  const amount = order.type === 'consultation' ? order.service && order.service.amount : order.amount;
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) return false;
  const serializedOrder = JSON.stringify(order);
  return serializedOrder.length <= MAX_EMAIL_FIELD_LENGTH;
}

function getOrCreateOrderSheet() {
  const properties = PropertiesService.getScriptProperties();
  const spreadsheetId = properties.getProperty('ORDERS_SPREADSHEET_ID');
  let spreadsheet;
  if (spreadsheetId) {
    spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  } else {
    spreadsheet = SpreadsheetApp.create('Ashkanani Sport - Paid Orders');
    properties.setProperty('ORDERS_SPREADSHEET_ID', spreadsheet.getId());
  }

  let sheet = spreadsheet.getSheetByName(ORDER_SHEET_NAME);
  if (!sheet) {
    sheet = spreadsheet.getSheets()[0];
    sheet.setName(ORDER_SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, ORDER_SHEET_HEADERS.length).setValues([ORDER_SHEET_HEADERS]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function savePaidOrder(sheet, reference, order) {
  const lastRow = sheet.getLastRow();
  const referenceRange = lastRow > 1 ? sheet.getRange(2, 1, lastRow - 1, 1) : null;
  const existingCell = referenceRange
    ? referenceRange.createTextFinder(reference).matchEntireCell(true).findNext()
    : null;
  const serializedOrder = JSON.stringify(order);
  const amount = order.type === 'consultation' ? order.service.amount : order.amount;

  if (existingCell) {
    const row = existingCell.getRow();
    const existing = sheet.getRange(row, 1, 1, ORDER_SHEET_HEADERS.length).getValues()[0];
    if (existing[1] !== order.type || existing[5] !== serializedOrder) {
      throw new Error('Paid order reference conflicts with an existing row');
    }
    return row;
  }

  const row = lastRow + 1;
  sheet.getRange(row, 1, 1, ORDER_SHEET_HEADERS.length).setValues([[
    reference,
    order.type,
    'paid',
    new Date(),
    Number(amount).toFixed(3),
    serializedOrder,
    'pending',
    '',
  ]]);
  return row;
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
