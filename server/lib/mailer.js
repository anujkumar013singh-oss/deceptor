const nodemailer = require('nodemailer');

// Create a pooled transporter that maintains persistent authenticated connections
const transporter = nodemailer.createTransport({
  pool: true,
  host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: false, // 587 = STARTTLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  maxConnections: 5,
  maxMessages: 100,
  rateDelta: 1000,
  rateLimit: 5,
});

// Warm up and verify the SMTP connection pool on boot
transporter.verify((error) => {
  if (error) {
    console.error('⚠️ SMTP Pool Warmup Error:', error.message);
  } else {
    console.log('⚡ SMTP Connection Pool Ready: Ultra-Fast Email Delivery Active');
  }
});

/**
 * Send an OTP email via Brevo SMTP with Deceptor's dark cybernetic design
 */
const sendOTPEmail = async ({ to, otp, purpose }) => {
  const isSignup = purpose === 'signup';
  const purposeLabel = isSignup ? 'Account Verification' : 'Password Reset';
  const purposeDesc = isSignup
    ? 'Use the verification code below to complete your registration and initialize your video hosting account.'
    : 'Use the security code below to authorize your password reset request.';
  const expiryMinutes = 10;
  const logoUrl = 'https://res.cloudinary.com/dhudpc4eu/image/upload/v1787121249/pixora-uploads/pixora-bg-1787121249639-esge0v.png';

  const mailOptions = {
    from: `"Deceptor Security" <${process.env.SMTP_FROM}>`,
    to,
    subject: `${otp} is your Deceptor verification code`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>Deceptor Verification</title>
      </head>
      <body style="margin:0;padding:0;background-color:#02040a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#02040a;padding:48px 16px;">
          <tr>
            <td align="center">
              
              <!-- Main Email Card Container -->
              <table width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;background:#090e1a;border:1px solid #1e293b;border-radius:24px;overflow:hidden;box-shadow:0 24px 64px rgba(0,0,0,0.8),0 0 0 1px rgba(255,255,255,0.04);">
                
                <!-- Top Brand Strip -->
                <tr>
                  <td style="padding:36px 40px 24px;border-bottom:1px solid #141f36;background:linear-gradient(180deg,#0d1527 0%,#090e1a 100%);">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <!-- Left: Brand Logo & Title -->
                        <td align="left">
                          <table cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="vertical-align:middle;padding-right:12px;">
                                <img src="${logoUrl}" alt="Deceptor Logo" width="36" height="36" style="display:block;border-radius:50%;border:1px solid rgba(56,189,248,0.4);" />
                              </td>
                              <td style="vertical-align:middle;">
                                <span style="font-size:20px;font-weight:800;letter-spacing:-0.5px;color:#ffffff;text-transform:uppercase;">DECEPTOR</span>
                              </td>
                            </tr>
                          </table>
                        </td>
                        <!-- Right: Live System Status Pill -->
                        <td align="right">
                          <span style="display:inline-block;background:#06231d;border:1px solid #059669;border-radius:9999px;padding:4px 10px;font-size:11px;font-weight:600;letter-spacing:0.5px;color:#34d399;text-transform:uppercase;">
                            ● SECURE LINK
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Content Body -->
                <tr>
                  <td style="padding:36px 40px;">
                    
                    <!-- Purpose Badge -->
                    <div style="margin-bottom:16px;">
                      <span style="display:inline-block;background:#0f1d38;border:1px solid #1d4ed8;border-radius:6px;padding:4px 10px;font-size:11px;font-weight:700;letter-spacing:1px;color:#38bdf8;text-transform:uppercase;">
                        ${purposeLabel}
                      </span>
                    </div>

                    <!-- Main Heading -->
                    <h1 style="margin:0 0 12px;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.4px;line-height:1.3;">
                      ${isSignup ? 'Verify Your Email Address' : 'Confirm Password Reset'}
                    </h1>

                    <!-- Description -->
                    <p style="margin:0 0 28px;color:#94a3b8;font-size:14px;line-height:1.6;">
                      ${purposeDesc}
                    </p>

                    <!-- OTP Code Box -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
                      <tr>
                        <td style="background:#030712;border:1.5px solid #2563eb;border-radius:16px;padding:28px 20px;text-align:center;box-shadow:0 0 30px rgba(37,99,235,0.15);">
                          <div style="font-size:11px;font-weight:600;letter-spacing:2px;color:#64748b;text-transform:uppercase;margin-bottom:10px;">
                            ONE-TIME VERIFICATION CODE
                          </div>
                          <div style="font-family:'SFMono-Regular',Consolas,'Liberation Mono',Menlo,Courier,monospace;font-size:42px;font-weight:800;letter-spacing:14px;color:#38bdf8;text-shadow:0 0 18px rgba(56,189,248,0.4);padding-left:14px;">
                            ${otp}
                          </div>
                          <div style="margin-top:14px;display:inline-block;background:#0d1933;border-radius:9999px;padding:4px 14px;font-size:12px;font-weight:500;color:#93c5fd;">
                            ⏱ Expires in ${expiryMinutes} minutes
                          </div>
                        </td>
                      </tr>
                    </table>

                    <!-- Security Info Box -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="background:#070d1a;border:1px solid #14213d;border-radius:12px;padding:16px;">
                      <tr>
                        <td>
                          <p style="margin:0 0 8px;color:#e2e8f0;font-size:13px;font-weight:600;">
                            🛡️ Security Advisory
                          </p>
                          <p style="margin:0;color:#64748b;font-size:12px;line-height:1.5;">
                            • Deceptor staff will never ask for this code.<br/>
                            • If you did not initiate this request, you can safely ignore this email.
                          </p>
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding:24px 40px;background:#060a14;border-top:1px solid #141f36;text-align:center;">
                    <p style="margin:0 0 6px;color:#64748b;font-size:12px;font-weight:500;">
                      Deceptor · Permanent Universal Video Hosting
                    </p>
                    <p style="margin:0;color:#475569;font-size:11px;">
                      Lossless 4K Streaming • Lifetime Links • Zero Expiration
                    </p>
                  </td>
                </tr>

              </table>

              <!-- Sub-footer copyright -->
              <table width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;margin-top:20px;">
                <tr>
                  <td align="center" style="color:#475569;font-size:11px;line-height:1.5;">
                    This is an automated system notification. Please do not reply directly to this email.<br/>
                    © ${new Date().getFullYear()} Deceptor. All rights reserved.
                  </td>
                </tr>
              </table>

            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  };

  return transporter.sendMail(mailOptions);
};

module.exports = { sendOTPEmail };
