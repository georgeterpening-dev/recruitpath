/**
 * RecruitPath — Terms of Service
 * Styled to match app design: #0A0A0A bg, Bebas Neue heading, DM Sans body, #F5C518 accents
 */
import { Link } from "wouter";
import AppFooter from "@/components/AppFooter";

const EFFECTIVE_DATE = "March 30, 2026";

const sections = [
  {
    title: "1. Acceptance of Terms",
    content: `By accessing or using RecruitPath (the "Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you may not access or use the Service. These Terms constitute a legally binding agreement between you and RecruitPath ("we," "us," or "our"). We reserve the right to update these Terms at any time, and your continued use of the Service following any changes constitutes acceptance of the revised Terms.`,
  },
  {
    title: "2. Description of Service",
    content: `RecruitPath is an AI-powered college recruiting platform designed to assist student athletes in identifying college programs, building athletic profiles, and generating personalized outreach communications to college coaches. The Service is currently in beta and focuses on men's collegiate volleyball programs across all NCAA divisions (Division I, Division II, Division III), NAIA, and JUCO. RecruitPath leverages artificial intelligence, including large language model technology, to generate recruiting emails and provide program matching recommendations. The Service is provided on an "as-is" basis during the beta period, and features may change without notice.`,
  },
  {
    title: "3. User Eligibility",
    content: `The Service is intended for users who are 13 years of age or older. By using the Service, you represent and warrant that you are at least 13 years old. The Service is primarily designed for high school student athletes and their parents or guardians who are engaged in the college athletic recruiting process. Users under the age of 18 should review these Terms with a parent or guardian. We do not knowingly collect personal information from children under 13. If we become aware that a user under 13 has provided personal information, we will take steps to delete such information promptly.`,
  },
  {
    title: "4. Account Registration and Security",
    content: `To access certain features of the Service, you must create an account using Manus OAuth authentication. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account. We reserve the right to terminate accounts, remove content, or cancel access at our sole discretion. You agree to provide accurate, current, and complete information during registration and to update such information as necessary to keep it accurate.`,
  },
  {
    title: "5. One-Time Payment Terms",
    content: `Access to the full features of RecruitPath requires a one-time payment of $49.99 USD ("Full Access"). This is a non-refundable purchase. By completing payment, you receive lifetime access to all features included in the Full Access tier at the time of purchase, including unlimited school tracking, AI-powered recruiting email generation, the Roster Gap Finder, the School Finder Questionnaire, and the complete coach directory for all 291 programs in the database.\n\nRecruitPath does not guarantee any specific recruiting outcome, including but not limited to admission to any college or university, athletic scholarship offers, or communication responses from coaches. The Service is a tool to assist in the recruiting process; outcomes depend entirely on the athlete's qualifications, coach interest, and institutional factors outside our control.\n\nPayments are processed securely through Stripe. By completing a purchase, you also agree to Stripe's Terms of Service at https://stripe.com/legal.`,
  },
  {
    title: "6. Acceptable Use Policy",
    content: `You agree to use the Service only for lawful purposes and in accordance with these Terms. You agree not to:\n\n• Use the AI email generation feature to send spam, unsolicited bulk communications, or messages that misrepresent your identity or athletic qualifications.\n• Submit false, misleading, or fraudulent profile information.\n• Attempt to gain unauthorized access to any portion of the Service or its related systems.\n• Use the Service to harass, threaten, or harm any individual, including coaches or athletic staff.\n• Reverse engineer, decompile, or attempt to extract the source code of the Service.\n• Use automated tools, bots, or scrapers to access or collect data from the Service.\n• Resell, sublicense, or commercially exploit any portion of the Service without our express written consent.\n\nViolation of this policy may result in immediate termination of your account without refund.`,
  },
  {
    title: "7. Intellectual Property",
    content: `RecruitPath and its licensors own all intellectual property rights in and to the Service, including but not limited to the platform software, design, AI models, coach database, and all content generated by the Service. These Terms do not grant you any right, title, or interest in the Service beyond the limited license to use it as described herein.\n\nYou retain ownership of the personal profile data you submit to the Service, including your name, athletic statistics, academic information, and other profile content ("User Content"). By submitting User Content, you grant RecruitPath a non-exclusive, worldwide, royalty-free license to use, store, and process your User Content solely for the purpose of providing and improving the Service. We will not sell your personal profile data to third parties.`,
  },
  {
    title: "8. Disclaimer of Warranties",
    content: `THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.\n\nRecruitPath is currently in beta. We do not warrant that the Service will be uninterrupted, error-free, or free of viruses or other harmful components. We do not guarantee the accuracy, completeness, or timeliness of any coach contact information, roster data, program details, or other information provided through the Service. Coach contact information and roster data may become outdated, and we make no representation that any information in the database is current or accurate at the time of your use.`,
  },
  {
    title: "9. Limitation of Liability",
    content: `TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, RECRUITPATH AND ITS OFFICERS, DIRECTORS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, GOODWILL, OR OTHER INTANGIBLE LOSSES, ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF OR INABILITY TO USE THE SERVICE.\n\nIN NO EVENT SHALL RECRUITPATH'S TOTAL LIABILITY TO YOU FOR ALL CLAIMS ARISING OUT OF OR RELATED TO THESE TERMS OR THE SERVICE EXCEED THE AMOUNT PAID BY YOU FOR ACCESS TO THE SERVICE IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM, OR $49.99, WHICHEVER IS GREATER.`,
  },
  {
    title: "10. Third-Party Services",
    content: `The Service integrates with the following third-party services, each of which is subject to its own terms and privacy policies:\n\n• Stripe (stripe.com) — payment processing for the one-time Full Access purchase.\n• Manus OAuth — account authentication and identity management.\n• Anthropic Claude API — AI language model used to generate recruiting email drafts.\n• Logo.dev — school logo imagery displayed within the platform.\n\nRecruitPath is not responsible for the practices, content, or availability of any third-party services. Your use of third-party services is at your own risk and subject to their respective terms.`,
  },
  {
    title: "11. Data and Privacy",
    content: `Your use of the Service is also governed by our Privacy Policy, available at /privacy, which is incorporated into these Terms by reference. By using the Service, you consent to the collection and use of your information as described in the Privacy Policy. We implement reasonable technical and organizational measures to protect your personal data, but no method of transmission over the Internet is 100% secure.`,
  },
  {
    title: "12. Termination",
    content: `We reserve the right to suspend or terminate your access to the Service at any time, with or without cause, and with or without notice. Upon termination, your right to use the Service will immediately cease. If your account is terminated for violation of these Terms, you will not be entitled to a refund of any amounts paid. You may request deletion of your account and associated data at any time by contacting us at contact.recruitpath@gmail.com.`,
  },
  {
    title: "13. Changes to Terms",
    content: `We may revise these Terms from time to time. The most current version will always be available at /terms. If a revision is material, we will make reasonable efforts to notify registered users via email or an in-app notification. By continuing to use the Service after revisions become effective, you agree to be bound by the updated Terms.`,
  },
  {
    title: "14. Governing Law",
    content: `These Terms shall be governed by and construed in accordance with the laws of the State of California, without regard to its conflict of law provisions. Any disputes arising under or in connection with these Terms shall be subject to the exclusive jurisdiction of the state and federal courts located in California.`,
  },
  {
    title: "15. Contact Information",
    content: `If you have any questions about these Terms of Service, please contact us at:\n\nRecruitPath\nEmail: contact.recruitpath@gmail.com`,
  },
];

export default function Terms() {
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
          TERMS OF SERVICE
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
                  marginBottom: para.startsWith("•") ? "4px" : "16px",
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
