/**
 * RecruitPath — Email helper using Nodemailer + Gmail SMTP
 * Credentials come from EMAIL_USER and EMAIL_PASS env vars.
 */
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/** Extract first name from a full name string */
function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? fullName;
}

/**
 * Send an affiliate approval email.
 * Returns true on success, false on failure (error is logged but not thrown).
 */
export async function sendAffiliateApprovalEmail(opts: {
  toEmail: string;
  toName: string;
  couponCode: string;
}): Promise<boolean> {
  const name = firstName(opts.toName);
  const link = `https://recruitpath.manus.space/?ref=${opts.couponCode}`;

  const text = `Hey ${name},

Great news — you've been approved as a RecruitPath affiliate!

Your personal code is: ${opts.couponCode}

Share it anywhere — your Instagram bio, group chats, at tournaments. When a teammate signs up using your code they get 15% off their first month, and you earn $3 for every monthly signup and $5 for every annual signup.

Your shareable link: ${link}

To set up your payout method (Venmo or PayPal), just reply to this email. Commissions are paid monthly once you hit a $10 minimum.

Welcome to the team.

— George
RecruitPath
contact.recruitpath@gmail.com`;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: opts.toEmail,
      subject: "You're a RecruitPath Affiliate — Here's Your Code",
      text,
    });
    return true;
  } catch (err) {
    console.error("[mailer] Failed to send approval email to", opts.toEmail, err);
    return false;
  }
}

/**
 * Send an affiliate rejection email.
 * Returns true on success, false on failure (error is logged but not thrown).
 */
export async function sendAffiliateRejectionEmail(opts: {
  toEmail: string;
  toName: string;
}): Promise<boolean> {
  const name = firstName(opts.toName);

  const text = `Hey ${name},

Thanks for applying to the RecruitPath affiliate program.

We aren't able to move forward with your application at this time, but we appreciate your interest and will keep your information on file.

If you have any questions feel free to reach out at contact.recruitpath@gmail.com.

— George
RecruitPath`;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: opts.toEmail,
      subject: "RecruitPath Affiliate Application Update",
      text,
    });
    return true;
  } catch (err) {
    console.error("[mailer] Failed to send rejection email to", opts.toEmail, err);
    return false;
  }
}
