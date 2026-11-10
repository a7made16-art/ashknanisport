<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1PkS0Q9OK2-SU5USOTT90LB-qofO3EmMe

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Consultation Payments

The paid consultation checkout uses Vercel Functions under `api/consultations/`.
Set these environment variables in the Vercel project before enabling live checkout:

| Variable | Purpose |
| --- | --- |
| `SITE_URL` | Exact public site origin, for example `https://ashkananisport.com` |
| `UPAYMENTS_MODE` | `sandbox` for testing or `live` for real payments |
| `UPAYMENTS_API_KEY` | UPayments API key from the Merchant API Details dashboard |
| `UPAYMENTS_API_SECRET` | UPayments API secret used for HMAC signatures |
| `CLOUDINARY_CLOUD_NAME` | Optional override; defaults to the cloud name provided for this project |
| `CLOUDINARY_API_KEY` | Optional override; defaults to the API key provided for this project |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret; used only by the Vercel signature endpoint |
| `BOOKING_SIGNING_SECRET` | Random secret of at least 32 characters used to protect booking details during checkout |
| `PAYMENT_RECOVERY_SECRET` | Optional random secret of at least 32 characters for manually recovering an already captured payment |
| `GOOGLE_APPS_SCRIPT_URL` | Deployed Gmail notification web app URL |
| `GOOGLE_APPS_SCRIPT_SECRET` | Shared random secret, at least 32 characters, also stored in Apps Script properties |

Generate a signing secret with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
Start with UPayments sandbox credentials and make a test booking before switching
`UPAYMENTS_MODE` to `live`. Do not put UPayments credentials or server-side
secrets in `VITE_*` variables or client-side source files. The payment
credentials previously shared in chat were exposed; rotate them and use only
replacement credentials in Vercel environment variables.

Charge requests send both `Accept: application/json` and
`Content-Type: application/json`; UPayments' [FAQ](https://developers.upayments.com/reference/faqs)
identifies both as required to avoid charge API 401 responses. The charge
request signs `timestamp + POST + charge + exact JSON body` with the API Secret.
Both charge creation and payment-status requests use the API Key as a Bearer
token and sign requests with the API Secret. Use the actual, non-encrypted API
Key, not the Encrypted API Key or Merchant ID. Failed UPayments responses are
logged with only sanitized error fields, endpoint, stage, and HTTP status.

Email notifications are sent from and to `Ashkananisport@gmail.com` by the
Google Apps Script in [`google-apps-script/Code.gs`](./google-apps-script/Code.gs).
Create a new Apps Script project while signed in to that Gmail account, paste
the script, add a Script Property named `NOTIFICATION_SECRET` with the same
random value used for `GOOGLE_APPS_SCRIPT_SECRET`, then deploy it as a Web App:
execute as your account and allow access to anyone. Add the deployment URL and
the shared secret to the Vercel environment variables, then redeploy. The script
rejects deployment under a different Gmail account, creates a company-owned
Google spreadsheet on first use, and saves each verified paid order once before
sending the notification. Duplicate rows and emails are suppressed across
repeated callbacks and recovery attempts. After changing `Code.gs`, publish a
new web-app deployment version and approve its Sheets and Gmail permissions.
Gmail sending quotas apply.

The API validates consultation prices on the server in
[`server/consultationPayments.js`](./server/consultationPayments.js); update that
catalog together with `public/company.json` if prices change. The no-fee service
continues directly to WhatsApp and does not request payment. Email notifications
are sent after an authenticated UPayments status lookup confirms the transaction,
both from the UPayments server-to-server notification and the customer return
verification. Both paths verify the signed order data, captured result, track ID,
order reference, currency, and exact amount. Duplicate email requests are
deduplicated by the Apps Script. The browser return never confirms payment by
itself.

To retry notification for a payment that was captured but not notified, configure
`PAYMENT_RECOVERY_SECRET` and make an authenticated `POST` to
`/api/admin/recover-payment` with `{"trackId":"<UPayments track ID>"}` and the
`x-payment-recovery-secret` header. The endpoint independently checks the
captured transaction, signed order, track ID, merchant order reference, KWD
currency, and exact amount before sending the company's notification email. It
does not create another charge. Recovery depends on UPayments returning the
original signed `customer_extra_data`; if it is unavailable or the signing
secret has changed, contact UPayments and reconcile the transaction manually.

The Google Apps Script spreadsheet is the durable record of verified paid
consultation and montage orders; it is created automatically under the company
Google account the first time a verified order is processed. Email notifications
are sent only to `Ashkananisport@gmail.com`, never to the customer. The checkout
forms currently do not collect a customer email address. WhatsApp is a prefilled
message that the customer must send manually;
automatic WhatsApp delivery requires a separately configured WhatsApp Business
API. Payment status is verified server-side before the order is saved or the
company email is sent.
The existing availability integration runs before checkout, so verify
its calendar behavior and clear unpaid holds if a customer abandons checkout.

Match-editing orders use the same UPayments credentials and notification flow.
The online prices are defined server-side: 1 match for 6 KWD, 2 for 12 KWD,
3 for 20 KWD, and 4 for 26 KWD. Prices include the company logo; omitting it
adds 3 KWD. Update the server catalog and package selector in
`src/components/Services.tsx` together if prices change. The three selected images are uploaded directly to Cloudinary before
checkout using short-lived signed upload parameters; the API secret stays in
Vercel. Add `CLOUDINARY_API_SECRET` in Vercel before enabling image uploads.
After payment, the notification email contains clickable image links,
and the customer can open a prefilled WhatsApp message containing those links.
The customer must press Send in WhatsApp. If checkout is abandoned after image
upload, those images remain in the `montage-pending` Cloudinary folder and may
be deleted from the Cloudinary Media Library.
