/**
 * Transactional email templates for ConsentHub.
 *
 * Written for email clients, not browsers: table-based layout, inline styles,
 * no external CSS and no web fonts. Outlook ignores most modern CSS, Gmail
 * strips <style> blocks in some contexts, and many clients block images by
 * default - so the header is real text rather than a logo image, and every
 * template degrades to something readable with images off.
 *
 * Colours are SLT-Mobitel's: #0b2a58 deep navy, #0d478b primary blue.
 */

const NAVY = '#0b2a58';
const BLUE = '#0d478b';
const TEXT = '#1f2937';
const MUTED = '#6b7280';
const BORDER = '#e5e7eb';
const CANVAS = '#f4f6f9';

/**
 * Absolute URL for the logo. Email clients cannot resolve relative paths, and
 * many block images by default - hence the alt text on the <img>.
 */
const logoUrl = () =>
  `${(process.env.PUBLIC_ASSET_URL || process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '')}/Logo-SLT.png`;

const esc = (v) =>
  String(v == null ? '' : v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/**
 * Shared shell: navy header, white content card, footer.
 * `bodyHtml` is inserted as-is, so callers must escape their own values.
 */
function layout({ title, preheader, bodyHtml }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
</head>
<body style="margin:0;padding:0;background-color:${CANVAS};">
  <!-- preheader: the grey preview line in the inbox list -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preheader || '')}</div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${CANVAS};">
    <tr>
      <td align="center" style="padding:24px 12px;">

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
               style="max-width:600px;background-color:#ffffff;border-radius:12px;overflow:hidden;
                      border:1px solid ${BORDER};font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">

          <!-- Header: the SLT-Mobitel logo is dark blue and green, so it sits on
               white. The navy appears as the rule beneath it. -->
          <tr>
            <td style="background-color:#ffffff;padding:26px 32px 18px;">
              <img src="${logoUrl()}" width="180" alt="SLT-Mobitel"
                   style="display:block;border:0;outline:none;text-decoration:none;
                          width:180px;max-width:180px;height:auto;" />
              <div style="font-size:12px;color:${MUTED};margin-top:10px;letter-spacing:0.4px;">
                Consent Management System
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color:${NAVY};height:4px;line-height:4px;font-size:0;">&nbsp;</td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;color:${TEXT};font-size:15px;line-height:1.6;">
              ${bodyHtml}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f8fafc;border-top:1px solid ${BORDER};padding:20px 32px;
                       color:${MUTED};font-size:12px;line-height:1.6;">
              This is an automated message from the SLT-Mobitel Consent Management System.
              Please do not reply to this address.<br>
              &copy; ${new Date().getFullYear()} Sri Lanka Telecom PLC. All rights reserved.
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** A button that still renders as a filled block in Outlook. */
function button(href, label) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0;">
    <tr>
      <td align="center" bgcolor="${BLUE}" style="border-radius:8px;">
        <a href="${esc(href)}"
           style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;
                  color:#ffffff;text-decoration:none;border-radius:8px;">${esc(label)}</a>
      </td>
    </tr>
  </table>`;
}

/**
 * Enterprise registration approved — carries the one-time activation link.
 */
function enterpriseApproved({ firstName, organisationName, loginEmail, activationLink, expiryHours = 24 }) {
  const bodyHtml = `
    <p style="margin:0 0 16px;font-size:20px;font-weight:600;color:${NAVY};">
      Your enterprise account is approved
    </p>

    <p style="margin:0 0 16px;">Hello ${esc(firstName)},</p>

    <p style="margin:0 0 16px;">
      The registration for <strong>${esc(organisationName)}</strong> has been approved.
      You can now activate your account and set a password.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
           style="background-color:#eff5fc;border:1px solid #d8e6f7;border-radius:8px;margin:0 0 8px;">
      <tr>
        <td style="padding:14px 16px;font-size:13px;color:${MUTED};">
          Sign in with
          <div style="font-size:15px;color:${TEXT};font-weight:600;margin-top:4px;">${esc(loginEmail)}</div>
        </td>
      </tr>
    </table>

    ${button(activationLink, 'Activate your account')}

    <p style="margin:0 0 8px;font-size:13px;color:${MUTED};">
      This link can be used once and expires in ${esc(expiryHours)} hours.
      If the button does not work, copy this address into your browser:
    </p>
    <p style="margin:0 0 24px;font-size:12px;color:${BLUE};word-break:break-all;">
      ${esc(activationLink)}
    </p>

    <p style="margin:0;padding-top:20px;border-top:1px solid ${BORDER};font-size:13px;color:${MUTED};">
      If you were not expecting this email, you can ignore it — the account stays
      inactive until the link above is used.
    </p>`;

  const text = [
    `Your enterprise account is approved`,
    ``,
    `Hello ${firstName},`,
    ``,
    `The registration for ${organisationName} has been approved. You can now activate`,
    `your account and set a password.`,
    ``,
    `Sign in with: ${loginEmail}`,
    ``,
    `Activate your account:`,
    activationLink,
    ``,
    `This link can be used once and expires in ${expiryHours} hours.`,
    ``,
    `If you were not expecting this email you can ignore it - the account stays`,
    `inactive until the link above is used.`,
    ``,
    `--`,
    `SLT-Mobitel Consent Management System`,
    `This is an automated message. Please do not reply.`,
  ].join('\n');

  return {
    subject: `Activate your ConsentHub enterprise account — ${organisationName}`,
    text,
    html: layout({
      title: 'Your enterprise account is approved',
      preheader: `Activate your ConsentHub account for ${organisationName}. Link expires in ${expiryHours} hours.`,
      bodyHtml,
    }),
  };
}

module.exports = { layout, button, enterpriseApproved };
