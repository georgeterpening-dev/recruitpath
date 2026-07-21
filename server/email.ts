/**
 * Email helper — sends transactional emails via Gmail SMTP.
 * Uses the contact.recruitpath@gmail.com account with an App Password.
 * Falls back gracefully if credentials are not configured.
 */
import nodemailer from "nodemailer";
import { ENV } from "./_core/env";

function getTransporter() {
  console.log("[Email] Checking credentials — user:", ENV.emailUser ? "SET" : "NOT SET", "pass:", ENV.emailPass ? "SET" : "NOT SET");
  const user = ENV.emailUser || process.env.EMAIL_USER;
  const pass = ENV.emailPass || process.env.EMAIL_PASS;

  if (!user || !pass) {
    console.warn("[Email] EMAIL_USER or EMAIL_PASS not set — email sending disabled");
    return null;
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
}

/**
 * Send a purchase confirmation email to the user.
 * Returns true on success, false if credentials are missing or send fails.
 */
export async function sendPurchaseConfirmationEmail({
  toEmail,
  toName,
  dashboardUrl,
}: {
  toEmail: string;
  toName: string;
  dashboardUrl: string;
}): Promise<boolean> {
  const transporter = getTransporter();
  if (!transporter) return false;

  const firstName = toName?.split(" ")[0] || "Athlete";

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to RecruitPath</title>
</head>
<body style="margin:0;padding:0;background:#0A0A0A;font-family:'DM Sans',Arial,sans-serif;color:#F8FAFC;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0A0A;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#111111;border-radius:16px;border:1px solid #2A2A2A;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="background:#F5C518;padding:24px 32px;">
              <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.15em;color:#0A0A0A;text-transform:uppercase;">RecruitPath</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px 32px;">
              <h1 style="margin:0 0 8px;font-size:36px;font-weight:900;letter-spacing:-0.02em;color:#FFFFFF;text-transform:uppercase;line-height:1.1;">You're in, ${firstName}.</h1>
              <p style="margin:0 0 32px;font-size:16px;color:#94A3B8;line-height:1.6;">Your payment of <strong style="color:#F5C518;">$49.99</strong> was confirmed. You now have full, lifetime access to every feature in RecruitPath.</p>

              <!-- Feature list -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#1A1A1A;border-radius:12px;border:1px solid #2A2A2A;margin-bottom:32px;">
                <tr><td style="padding:20px 24px;">
                  <p style="margin:0 0 16px;font-size:11px;font-weight:700;letter-spacing:0.12em;color:#F5C518;text-transform:uppercase;">What you now have access to</p>
                  ${[
                    "Unlimited school tracking",
                    "Roster Gap Finder for every program",
                    "AI-powered email generation",
                    "Gmail integration — send directly from your account",
                    "Outreach tracker and follow-up generator",
                    "School finder quiz",
                    "Coach directory access",
                  ].map(f => `
                  <table cellpadding="0" cellspacing="0" style="margin-bottom:10px;">
                    <tr>
                      <td style="width:20px;vertical-align:top;padding-top:2px;">
                        <span style="color:#F5C518;font-size:14px;font-weight:700;">✓</span>
                      </td>
                      <td style="padding-left:10px;font-size:14px;color:#E2E8F0;line-height:1.5;">${f}</td>
                    </tr>
                  </table>`).join("")}
                </td></tr>
              </table>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${dashboardUrl}" style="display:inline-block;background:#F5C518;color:#0A0A0A;font-size:13px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;text-decoration:none;padding:14px 32px;border-radius:8px;">Go to My Dashboard →</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;border-top:1px solid #2A2A2A;">
              <p style="margin:0;font-size:12px;color:#64748B;text-align:center;">Questions? Reply to this email or contact us at <a href="mailto:contact.recruitpath@gmail.com" style="color:#F5C518;text-decoration:none;">contact.recruitpath@gmail.com</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  try {
    await transporter.sendMail({
      from: `"RecruitPath" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: "Welcome to RecruitPath — You're all set!",
      html,
      text: `Hi ${firstName},\n\nYour payment of $49.99 was confirmed. You now have full lifetime access to RecruitPath.\n\nWhat's included:\n- Unlimited school tracking\n- Roster Gap Finder for every program\n- AI-powered email generation\n- Gmail integration\n- Outreach tracker and follow-up generator\n- School finder quiz\n- Coach directory access\n\nGo to your dashboard: ${dashboardUrl}\n\nQuestions? contact.recruitpath@gmail.com\n\n— The RecruitPath Team`,
    });
    console.log(`[Email] Purchase confirmation sent to ${toEmail}`);
    return true;
  } catch (err: any) {
    console.error("[Email] Failed to send confirmation:", err.message);
    return false;
  }
}

/**
 * Generic email sender — used for affiliate approval/rejection emails.
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<boolean> {
  const transporter = getTransporter();
  if (!transporter) return false;

  try {
    await transporter.sendMail({
      from: `"RecruitPath" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
      text,
    });
    console.log(`[Email] Sent "${subject}" to ${to}`);
    return true;
  } catch (err: any) {
    console.error("[Email] Failed to send:", err.message);
    return false;
  }
}

/**
 * Send affiliate approval email with coupon code.
 * Named export as specified in the affiliate program spec.
 */
export async function sendAffiliateApprovalEmail(
  toEmail: string,
  firstName: string,
  couponCode: string
): Promise<boolean> {
  const link = `https://recruitpath.manus.space/?ref=${couponCode}`;
  const text = `Hey ${firstName},

You're in — welcome to the RecruitPath affiliate team.

We built RecruitPath because the recruiting process needed to be better for athletes. You're now part of making that happen for your teammates and community.

Here's everything you need to get started:

Your personal code: ${couponCode}
Your shareable link: ${link}

When someone signs up using your code they get 15% off their first month — and you earn $3 for every monthly signup and $5 for every annual signup. No cap, no expiration.

Share it anywhere — your Instagram bio, your club team group chat, at tournaments. The athletes who do best with this are the ones who genuinely believe in the product and talk about it naturally.

To set up your payout method reply to this email with your Venmo or PayPal. We pay out monthly once you hit $10.

Excited to have you with us.

— George
RecruitPath
contact.recruitpath@gmail.com`;

  return sendEmail({
    to: toEmail,
    subject: "Welcome to the RecruitPath Affiliate Team 🏐",
    html: `<pre style="font-family:sans-serif;white-space:pre-wrap">${text}</pre>`,
    text,
  });
}

/**
 * Send affiliate rejection email.
 * Named export as specified in the affiliate program spec.
 */
export async function sendAffiliateRejectionEmail(
  toEmail: string,
  firstName: string
): Promise<boolean> {
  const text = `Hey ${firstName},

Thank you for applying to the RecruitPath affiliate program — we genuinely appreciate your interest and the time you took to apply.

We aren't able to bring on new affiliates at this moment as we're keeping the program small while we're in beta. This is not a reflection of you or your application.

We'll be expanding the program as we grow and will keep your application on file. If a spot opens up that's a great fit we'll reach out directly.

In the meantime if you ever want to share RecruitPath with teammates just because you believe in it, we'd love that too.

Thanks again — and good luck with your recruiting process.

— George
RecruitPath
contact.recruitpath@gmail.com`;

  return sendEmail({
    to: toEmail,
    subject: "Your RecruitPath Affiliate Application",
    html: `<pre style="font-family:sans-serif;white-space:pre-wrap">${text}</pre>`,
    text,
  });
}
