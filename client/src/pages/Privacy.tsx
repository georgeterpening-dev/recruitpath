/**
 * RecruitPath — Privacy Policy
 * Styled to match app design: #0A0A0A bg, Bebas Neue heading, DM Sans body, #F5C518 accents
 */
import { Link } from "wouter";
import AppFooter from "@/components/AppFooter";

const EFFECTIVE_DATE = "March 30, 2026";

const sections = [
  {
    title: "1. Information We Collect",
    content: `We collect information you provide directly to us and information generated through your use of the Service.\n\n**Account Information:** When you register, we collect your name and email address through Manus OAuth authentication.\n\n**Athletic Profile Data:** Information you voluntarily enter into your profile, including first name, last name, graduation year, athletic position, high school name, GPA, height, weight, athletic statistics, and any other profile fields you choose to complete.\n\n**Payment Information:** When you purchase Full Access, payment is processed by Stripe. We store only a Stripe Payment Intent ID to confirm your purchase status. We do not store your full credit card number, CVV, or billing address — these are handled entirely by Stripe.\n\n**Usage Data:** We may collect information about how you interact with the Service, including pages visited, features used, schools added to your list, and emails generated. This data is used to improve the Service.\n\n**Communications:** If you contact us via email, we retain those communications to respond to your inquiry and improve our support.`,
  },
  {
    title: "2. How We Use Your Information",
    content: `We use the information we collect to:\n\n• Provide, operate, and maintain the Service, including generating personalized AI recruiting emails based on your profile data.\n• Authenticate your identity and manage your account.\n• Process your one-time payment and confirm your Full Access status.\n• Personalize your experience, including the School Finder Questionnaire results and school recommendations.\n• Improve and develop new features of the Service.\n• Communicate with you about your account, Service updates, or responses to your inquiries.\n• Notify you when new features (such as the Pro Suite) become available, if you have opted in.\n• Comply with legal obligations and enforce our Terms of Service.`,
  },
  {
    title: "3. Data Storage and Security",
    content: `Your data is stored in a managed cloud database hosted in the United States. We implement reasonable technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. These measures include encrypted connections (HTTPS/TLS), secure authentication tokens, and access controls.\n\nHowever, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to protect your personal information, we cannot guarantee its absolute security. In the event of a data breach that affects your personal information, we will notify you as required by applicable law.`,
  },
  {
    title: "4. Third-Party Services",
    content: `We share your information with the following third-party services only as necessary to provide the Service:\n\n**Stripe (stripe.com):** Processes your one-time payment. Stripe receives your email address and payment details. Stripe's Privacy Policy is available at https://stripe.com/privacy.\n\n**Manus:** Provides OAuth authentication for account creation and login. Manus receives your identity information during the authentication flow. Manus's Privacy Policy is available at https://manus.im.\n\n**Anthropic (anthropic.com):** Provides the Claude AI API used to generate recruiting email drafts. Your profile data (name, position, school, stats) is sent to Anthropic's API to generate personalized content. Anthropic's Privacy Policy is available at https://www.anthropic.com/privacy.\n\n**Logo.dev:** Provides school logo imagery. School domain names are sent to Logo.dev to retrieve logos. Logo.dev's Privacy Policy is available at https://logo.dev/privacy.\n\nWe do not sell your personal information to third parties. We do not share your information with advertisers or data brokers.`,
  },
  {
    title: "5. Cookies and Analytics",
    content: `We use session cookies to maintain your authenticated state while you use the Service. These cookies are essential for the Service to function and cannot be disabled.\n\nWe may use analytics tools to understand aggregate usage patterns and improve the Service. Analytics data is collected in an anonymized or pseudonymized form and does not identify you personally. You may opt out of analytics tracking by using browser privacy settings or extensions that block tracking scripts.\n\nWe do not use advertising cookies or share cookie data with advertising networks.`,
  },
  {
    title: "6. Your Rights",
    content: `You have the following rights with respect to your personal information:\n\n**Access:** You may request a copy of the personal information we hold about you.\n\n**Correction:** You may update or correct your profile information at any time through the Settings page within the Service.\n\n**Deletion:** You may request deletion of your account and associated personal data by contacting us at contact.recruitpath@gmail.com. We will process deletion requests within 30 days. Note that we may retain certain information as required by law or for legitimate business purposes (such as records of completed transactions).\n\n**Portability:** You may request an export of your profile data in a machine-readable format.\n\n**Opt-Out of Communications:** You may opt out of non-essential communications (such as Pro Suite launch notifications) at any time through the Settings page or by contacting us.`,
  },
  {
    title: "7. Children's Privacy",
    content: `The Service is not directed to children under the age of 13, and we do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child under 13 has provided us with personal information, please contact us at contact.recruitpath@gmail.com and we will take steps to delete such information promptly.\n\nUsers between the ages of 13 and 17 should review this Privacy Policy with a parent or guardian. We recommend that parents and guardians actively participate in their child's use of the Service, particularly when reviewing AI-generated email content before sending it to coaches.`,
  },
  {
    title: "8. Data Retention",
    content: `We retain your personal information for as long as your account is active or as needed to provide the Service. If you request deletion of your account, we will delete your personal profile data within 30 days, except where retention is required by law or necessary for legitimate business purposes such as fraud prevention or financial record-keeping.\n\nAI-generated email content is not stored by RecruitPath after it is displayed to you. We do not retain copies of emails you generate through the Service.`,
  },
  {
    title: "9. California Privacy Rights (CCPA)",
    content: `If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA):\n\n**Right to Know:** You have the right to request disclosure of the categories and specific pieces of personal information we have collected about you, the categories of sources from which it was collected, the business purpose for collecting it, and the categories of third parties with whom we share it.\n\n**Right to Delete:** You have the right to request deletion of personal information we have collected from you, subject to certain exceptions.\n\n**Right to Non-Discrimination:** We will not discriminate against you for exercising your CCPA rights.\n\n**Do Not Sell:** We do not sell your personal information as defined under the CCPA.\n\nTo exercise your California privacy rights, please contact us at contact.recruitpath@gmail.com with the subject line "California Privacy Request."`,
  },
  {
    title: "10. Changes to This Policy",
    content: `We may update this Privacy Policy from time to time. The most current version will always be available at /privacy. If we make material changes to how we collect, use, or share your personal information, we will notify you by email or through an in-app notice before the changes take effect. Your continued use of the Service after the effective date of the revised Privacy Policy constitutes your acceptance of the changes.`,
  },
  {
    title: "11. Contact Us",
    content: `If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us at:\n\nRecruitPath\nEmail: contact.recruitpath@gmail.com\n\nWe will respond to all privacy-related inquiries within 30 days.`,
  },
];

export default function Privacy() {
  return (
    <div style={{ background: "#0A0A0A", minHeight: "100vh", color: "#E2E8F0", paddingBottom: "120px" }}>
      {/* Back nav */}
      <div
        className="max-w-3xl mx-auto px-6 pt-10 pb-2"
        style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px" }}
      >
        <Link href="/">
          <span
            className="cursor-pointer transition-colors duration-150"
            style={{ color: "#888888" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#F5C518")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#888888")}
          >
            ← Back to RecruitPath
          </span>
        </Link>
      </div>

      {/* Header */}
      <div className="max-w-3xl mx-auto px-6 pt-8 pb-10">
        <div
          style={{
            width: "40px",
            height: "3px",
            background: "#F5C518",
            marginBottom: "20px",
          }}
        />
        <h1
          style={{
            fontFamily: "Bebas Neue, sans-serif",
            fontSize: "clamp(52px, 8vw, 72px)",
            color: "#FFFFFF",
            lineHeight: 1,
            letterSpacing: "-0.01em",
            marginBottom: "12px",
          }}
        >
          PRIVACY POLICY
        </h1>
        <p
          style={{
            fontFamily: "DM Sans, sans-serif",
            fontSize: "14px",
            color: "#888888",
          }}
        >
          Effective Date: {EFFECTIVE_DATE}
        </p>
      </div>

      {/* Divider */}
      <div className="max-w-3xl mx-auto px-6">
        <div style={{ height: "1px", background: "#1E1E1E", marginBottom: "40px" }} />
      </div>

      {/* Intro */}
      <div className="max-w-3xl mx-auto px-6 mb-10">
        <p
          style={{
            fontFamily: "DM Sans, sans-serif",
            fontSize: "15px",
            color: "#94A3B8",
            lineHeight: 1.75,
          }}
        >
          RecruitPath ("we," "us," or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use the RecruitPath platform. Please read this policy carefully. If you disagree with its terms, please discontinue use of the Service.
        </p>
      </div>

      {/* Sections */}
      <div className="max-w-3xl mx-auto px-6 pb-20">
        {sections.map((section, i) => (
          <div key={i} style={{ marginBottom: "40px" }}>
            <h2
              style={{
                fontFamily: "Bebas Neue, sans-serif",
                fontSize: "22px",
                color: "#F5C518",
                letterSpacing: "0.04em",
                marginBottom: "12px",
              }}
            >
              {section.title}
            </h2>
            {section.content.split("\n\n").map((para, j) => (
              <p
                key={j}
                style={{
                  fontFamily: "DM Sans, sans-serif",
                  fontSize: "15px",
                  color: "#94A3B8",
                  lineHeight: 1.75,
                  marginBottom: "16px",
                  whiteSpace: "pre-line",
                }}
              >
                {para}
              </p>
            ))}
            {i < sections.length - 1 && (
              <div style={{ height: "1px", background: "#1A1A1A", marginTop: "32px" }} />
            )}
          </div>
        ))}
      </div>

      <AppFooter />
    </div>
  );
}
