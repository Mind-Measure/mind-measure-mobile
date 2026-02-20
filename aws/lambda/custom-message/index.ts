interface CustomMessageEvent {
  triggerSource: string;
  request: {
    userAttributes: Record<string, string>;
    codeParameter: string;
    usernameParameter?: string;
  };
  response: {
    smsMessage: string | null;
    emailMessage: string | null;
    emailSubject: string | null;
  };
}

const BRAND = {
  spectra: '#2D4C4C',
  sinbad: '#99CCCE',
  pampas: '#FAF9F7',
  buttercup: '#F59E0B',
};

function buildEmailHtml(code: string, firstName: string, heading: string, bodyText: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${BRAND.pampas};font-family:'Inter','Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.pampas};padding:40px 20px;">
<tr><td align="center">
<table width="520" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(45,76,76,0.08);">

<!-- Header -->
<tr><td style="background:${BRAND.spectra};padding:32px 40px;text-align:center;">
  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40" fill="none">
    <circle cx="20" cy="20" r="20" fill="${BRAND.sinbad}" opacity="0.2"/>
    <path d="M12 26V16l4 6 4-6v10" stroke="${BRAND.sinbad}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M24 26V16l4 6" stroke="${BRAND.sinbad}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
  <div style="margin-top:12px;font-size:20px;font-weight:700;color:#fff;letter-spacing:-0.3px;">Mind Measure</div>
</td></tr>

<!-- Body -->
<tr><td style="padding:36px 40px;">
  <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:${BRAND.spectra};">${heading}</p>
  <p style="margin:0 0 24px;font-size:15px;color:rgba(45,76,76,0.6);line-height:1.6;">
    Hi${firstName ? ' ' + firstName : ''}, ${bodyText}
  </p>

  <!-- Code box -->
  <div style="background:${BRAND.pampas};border:1px solid rgba(45,76,76,0.1);border-radius:12px;padding:20px;text-align:center;margin-bottom:24px;">
    <div style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.15em;color:rgba(45,76,76,0.4);margin-bottom:8px;">Your verification code</div>
    <div style="font-size:36px;font-weight:800;letter-spacing:0.2em;color:${BRAND.spectra};">${code}</div>
  </div>

  <p style="margin:0 0 6px;font-size:13px;color:rgba(45,76,76,0.45);line-height:1.5;">
    This code expires in 24 hours. If you didn't request this, you can safely ignore this email.
  </p>
</td></tr>

<!-- Footer -->
<tr><td style="padding:20px 40px 28px;border-top:1px solid rgba(45,76,76,0.06);text-align:center;">
  <p style="margin:0;font-size:12px;color:rgba(45,76,76,0.35);">
    &copy; ${new Date().getFullYear()} Mind Measure Ltd. All rights reserved.<br/>
    <a href="https://mindmeasure.co.uk/privacy" style="color:${BRAND.sinbad};text-decoration:none;">Privacy Policy</a>
    &nbsp;&middot;&nbsp;
    <a href="https://mindmeasure.co.uk/terms" style="color:${BRAND.sinbad};text-decoration:none;">Terms of Service</a>
  </p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

export const handler = async (event: CustomMessageEvent): Promise<CustomMessageEvent> => {
  const { triggerSource, request } = event;
  const firstName = request.userAttributes?.given_name || request.userAttributes?.name || '';
  const code = request.codeParameter;

  switch (triggerSource) {
    case 'CustomMessage_SignUp':
      event.response.emailSubject = 'Welcome to Mind Measure — Verify your email';
      event.response.emailMessage = buildEmailHtml(
        code,
        firstName,
        'Welcome to Mind Measure',
        'thank you for signing up. Please use the verification code below to confirm your email address and get started.'
      );
      break;

    case 'CustomMessage_ForgotPassword':
      event.response.emailSubject = 'Mind Measure — Password Reset Code';
      event.response.emailMessage = buildEmailHtml(
        code,
        firstName,
        'Reset your password',
        'we received a request to reset your password. Use the code below to proceed.'
      );
      break;

    case 'CustomMessage_ResendCode':
      event.response.emailSubject = 'Mind Measure — Your Verification Code';
      event.response.emailMessage = buildEmailHtml(
        code,
        firstName,
        'Your verification code',
        'here is your new verification code. Please use it to confirm your email address.'
      );
      break;

    default:
      break;
  }

  return event;
};
