function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]);
}

function renderRows(labels, values, customCells = {}) {
  return labels.map((label, index) =>
    `<tr><th style="padding:8px;text-align:start">${escapeHtml(label)}</th><td style="padding:8px">${customCells[index] ?? escapeHtml(values[index])}</td></tr>`
  ).join('');
}

export function isGmailNotificationConfigured() {
  return Boolean(
    process.env.GOOGLE_APPS_SCRIPT_URL &&
    process.env.GOOGLE_APPS_SCRIPT_SECRET &&
    process.env.GOOGLE_APPS_SCRIPT_SECRET.length >= 32
  );
}

async function sendGmailNotification({ reference, subject, text, html, order }) {
  const url = process.env.GOOGLE_APPS_SCRIPT_URL;
  const secret = process.env.GOOGLE_APPS_SCRIPT_SECRET;
  if (!isGmailNotificationConfigured()) {
    throw new Error('Google Apps Script email is not configured');
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reference, subject, text, html, order, secret }),
  });
  if (!response.ok) {
    console.error('Google Apps Script email request failed:', response.status);
    throw new Error('Google Apps Script email request failed');
  }

  const result = await response.json();
  if (result.saved === true && (result.result === 'sent' || result.result === 'already_sent')) {
    return { orderSaved: true, notificationSent: true };
  }
  if (result.saved === true && result.stage === 'email') {
    console.error('Paid order was saved but the company email was not sent:', result.error || 'Unknown error');
    return { orderSaved: true, notificationSent: false };
  }
  if (result.saved !== true) {
    console.error('Google Apps Script could not save the paid order:', result.error || 'Unknown error');
    throw new Error('Paid order could not be saved');
  }
  if (result.result !== 'sent' && result.result !== 'already_sent') {
    console.error('Google Apps Script could not send the notification:', result.error || 'Unknown error');
    throw new Error('Gmail notification delivery failed');
  }
  throw new Error('Google Apps Script returned an invalid paid-order response');
}

export async function sendBookingEmail(reference, booking) {
  const labels = booking.language === 'ar'
    ? ['الاسم', 'الهاتف', 'الخدمة', 'التاريخ', 'الوقت', 'المبلغ']
    : ['Name', 'Phone', 'Service', 'Date', 'Time', 'Amount'];
  const values = [
    booking.name,
    booking.phone,
    booking.service.title,
    booking.date,
    booking.time,
    `${booking.service.amount.toFixed(3)} KWD`,
  ];
  const subject = booking.language === 'ar'
    ? `تم دفع استشارة جديدة - ${booking.name}`
    : `Paid consultation booking - ${booking.name}`;
  const text = [
    ...labels.map((label, index) => `${label}: ${values[index]}`),
    `UPayments reference: ${reference}`,
  ].join('\n');

  return sendGmailNotification({
    reference,
    subject,
    text,
    html: `<div dir="${booking.language === 'ar' ? 'rtl' : 'ltr'}"><h2>${escapeHtml(subject)}</h2><table>${renderRows(labels, values)}</table><p>UPayments reference: ${escapeHtml(reference)}</p></div>`,
    order: {
      type: 'consultation',
      ...booking,
      paymentStatus: 'paid',
      paymentReference: reference,
    },
  });
}

export async function sendMontageOrderEmail(reference, order) {
  const labels = order.language === 'ar'
    ? ['الاسم', 'رقم التواصل', 'سنة الميلاد', 'الباقة', 'السعر الأساسي', 'المبلغ بعد الإضافات', 'اللعبة', 'البطولة', 'تفاصيل المباريات', 'الصور', 'الشعار', 'ملاحظات']
    : ['Name', 'Contact number', 'Birth year', 'Package', 'Base price', 'Total after extras', 'Sport', 'Competition', 'Match details', 'Photos', 'Logo', 'Notes'];
  const values = [
    order.name,
    order.phone,
    String(order.birthYear),
    order.packageTitle,
    `${order.baseAmount.toFixed(3)} KWD`,
    `${order.amount.toFixed(3)} KWD`,
    order.sport,
    order.competition,
    order.matches.map((match, index) =>
      `Match ${index + 1}: ${match.firstTeam} - ${match.secondTeam}, ${match.matchDate}, ${match.matchVideoUrl}`
    ).join('\n'),
    order.photos.map((photo) => `${photo.name}: ${photo.secureUrl}`).join('\n'),
    order.includeLogo ? 'Yes / نعم' : 'No / لا',
    order.notes || '-',
  ];
  const matchDetails = order.matches.map((match, index) =>
    `Match ${index + 1}: ${escapeHtml(match.firstTeam)} - ${escapeHtml(match.secondTeam)} (${escapeHtml(match.matchDate)}) — <a href="${escapeHtml(match.matchVideoUrl)}">Full match video</a>`
  ).join('<br>');
  const photoLinks = order.photos.map((photo, index) =>
    `<a href="${escapeHtml(photo.secureUrl)}">Photo ${index + 1}: ${escapeHtml(photo.name)}</a>`
  ).join('<br>');
  const rows = renderRows(labels, values, { 8: matchDetails, 9: photoLinks });
  const subject = order.language === 'ar'
    ? `تم دفع طلب مونتاج - ${order.packageTitle}`
    : `Paid match editing order - ${order.packageTitle}`;
  const text = [
    ...labels.map((label, index) => `${label}: ${values[index]}`),
    `UPayments reference: ${reference}`,
  ].join('\n');

  return sendGmailNotification({
    reference,
    subject,
    text,
    html: `<div dir="${order.language === 'ar' ? 'rtl' : 'ltr'}"><h2>${escapeHtml(subject)}</h2><table>${rows}</table><p>UPayments reference: ${escapeHtml(reference)}</p></div>`,
    order: {
      type: 'montage',
      ...order,
      paymentStatus: 'paid',
      paymentReference: reference,
    },
  });
}
