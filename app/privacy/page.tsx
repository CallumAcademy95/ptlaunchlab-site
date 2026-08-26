import type { Metadata } from "next";
import LegalPage from "../components/LegalPage";
import { CONTACT_EMAIL, PHONE_NATIONAL } from "@/app/lib/contactDetails";

export const metadata: Metadata = {
  alternates: { canonical: "https://ptlaunchlab.co.uk/privacy" },
  title: "Privacy Policy | PT Launch Lab",
  description: "How PT Launch Lab collects, uses and protects your personal data.",
};

const p = (text: string) => <p>{text}</p>;
const ul = (items: string[]) => (
  <ul className="space-y-2 mt-2">
    {items.map((item, i) => (
      <li key={i} className="flex gap-2">
        <span className="text-[#F5C518] shrink-0 mt-0.5">•</span>
        <span>{item}</span>
      </li>
    ))}
  </ul>
);

const table = (rows: [string, string, string][]) => (
  <div className="overflow-x-auto mt-3">
    <table className="w-full text-sm border-collapse">
      <thead>
        <tr>
          {["Data", "Purpose", "Legal Basis"].map(h => (
            <th key={h} className="text-left text-[#F5C518] text-xs font-bold uppercase tracking-wider pb-2 pr-4 border-b border-[#1A3A5C]">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map(([d, p, l], i) => (
          <tr key={i} className="border-b border-[#0A2A44]">
            <td className="py-2.5 pr-4 text-white align-top">{d}</td>
            <td className="py-2.5 pr-4 align-top">{p}</td>
            <td className="py-2.5 align-top">{l}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default function PrivacyPage() {
  return (
    <LegalPage
      label="Legal"
      title="Privacy Policy"
      lastUpdated="March 2026"
      intro="PT Launch Lab is committed to protecting your personal data. This policy explains what data we collect, why we collect it, and your rights under UK data protection law."
      sections={[
        {
          title: "Who We Are",
          content: (
            <>
              {p("PT Launch Lab is the data controller for the personal data you provide when enquiring about or enrolling on our courses.")}
              {p(`Contact: ${CONTACT_EMAIL} | ${PHONE_NATIONAL}`)}
              {p("We process personal data in accordance with the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018.")}
            </>
          ),
        },
        {
          title: "Data We Collect",
          content: (
            <>
              {p("We collect personal data through the following channels:")}
              <p className="font-semibold text-white mt-3">Enrolment form</p>
              {ul([
                "Full legal name, title, date of birth, gender",
                "National Insurance number (required for NCFE qualification registration)",
                "Mobile number and email address",
                "Home address (including postcode)",
                "Highest educational qualification and GCSE grades",
                "Current employment status",
                "How you heard about us",
                "Electronic signature and agreement timestamp",
                "Payment choice (full or deposit)",
              ])}
              <p className="font-semibold text-white mt-3">Website and enquiries</p>
              {ul([
                "Name and email address submitted via contact or quiz forms",
                "IP address and browser information collected automatically via analytics",
                "Cookies (see our Cookie Policy)",
              ])}
            </>
          ),
        },
        {
          title: "How We Use Your Data",
          content: (
            <>
              {table([
                ["Name, address, NI number, DOB", "Register you with NCFE for your qualification", "Contract performance"],
                ["Email and mobile", "Course onboarding, tutor communication, payment updates", "Contract performance"],
                ["Email", "Confirmation emails and course progress updates", "Contract performance"],
                ["Signature and agreement checkboxes", "Record of your learner agreement for compliance purposes", "Legal obligation"],
                ["How you heard about us", "Internal marketing analysis to improve our reach", "Legitimate interests"],
                ["Employment status / qualifications", "Learner record required by NCFE", "Legal obligation"],
                ["Payment choice", "Processing your payment via Stripe", "Contract performance"],
              ])}
            </>
          ),
        },
        {
          title: "Third Party Processors",
          content: (
            <>
              {p("We share your data with the following trusted third parties who process it on our behalf:")}
              {ul([
                "NCFE — qualification awarding body. Receives your name, DOB, NI number and address for qualification registration.",
                "Stripe — payment processor. Handles card payments securely. PT Launch Lab does not store your card details. Stripe is PCI DSS compliant.",
                "Supabase — database provider. Our online learning platform stores its records, including your name, email address and course progress, in a secure Supabase database.",
                "Resend — transactional email provider. Sends service emails such as enrolment confirmations and course notifications. Receives your name and email address.",
                "MailerLite — email marketing platform. If you submit a form on this site, such as the quiz, the career planner or a webinar registration, your name and email address are added to our mailing list. Every email includes an unsubscribe link.",
                "Zapier — automation platform. Used to transfer enrolment data to our internal records (Google Sheets). Data is processed in transit only.",
                "Google (Google Sheets / Google Workspace) — enrolment records are stored in a secure, access-controlled Google Sheet.",
                "Google Analytics — website and conversion analytics. Receives event data about how this site is used, including purchase events sent from our server.",
                "Meta (Facebook and Instagram) — advertising measurement. When you submit a form on this site or complete a purchase, we send Meta a hashed (scrambled) version of details such as your email address, phone number, name, postcode and country, so we can measure how our adverts perform. Hashing means Meta does not receive these details in readable form.",
                "Anthropic — provider of the AI assistant in our website chat. Messages you type into the chat are sent to Anthropic in order to generate a reply. Please do not enter sensitive personal information into the chat.",
                "Calendly — appointment booking. If you book a call with us, Calendly receives your name, email address and the details of your booking.",
                "Vercel — our website hosting provider. Processes web requests and API calls.",
                "CookieYes — our cookie consent management platform. Stores your cookie preferences to ensure we only set non-essential cookies with your consent. CookieYes processes consent logs in accordance with GDPR.",
              ])}
              {p("We do not sell your personal data to any third party. We do not use your data for automated decision-making or profiling.")}
            </>
          ),
        },
        {
          title: "Marketing Communications",
          content: (
            <>
              {p("If you submit an enquiry or quiz form on our website, we may contact you with information about our courses. You can opt out at any time by replying to any email with 'unsubscribe' or contacting us directly.")}
              {p("We will not add you to any marketing list without a legitimate basis for doing so. Enrolled learners may receive course-related communications as part of their contract with us.")}
            </>
          ),
        },
        {
          title: "Data Retention",
          content: (
            <>
              {p("We retain your personal data for the following periods:")}
              {ul([
                "Enrolment records (including NI number and agreement): 7 years from the date of enrolment, to meet NCFE and financial record-keeping requirements",
                "Payment records: 7 years in line with HMRC requirements",
                "Marketing enquiry data: 12 months from last contact, or until you opt out",
                "Website analytics: aggregated data retained indefinitely; identifiable data deleted after 26 months",
              ])}
              {p("After the retention period expires, your data is securely deleted or anonymised.")}
            </>
          ),
        },
        {
          title: "Data Security",
          content: (
            <>
              {p("We take appropriate technical and organisational measures to protect your personal data against unauthorised access, loss, or disclosure. These include:")}
              {ul([
                "HTTPS encryption on all pages of this website",
                "Access-controlled storage for enrolment records",
                "Secure, encrypted payment processing via Stripe",
                "Restricted internal access to personal data on a need-to-know basis",
              ])}
              {p("In the event of a data breach that is likely to result in a risk to your rights and freedoms, we will notify the Information Commissioner's Office (ICO) within 72 hours and will inform affected individuals without undue delay.")}
            </>
          ),
        },
        {
          title: "Your Rights",
          content: (
            <>
              {p("Under UK GDPR, you have the following rights in relation to your personal data:")}
              {ul([
                "Right of access — request a copy of the data we hold about you",
                "Right to rectification — request correction of inaccurate or incomplete data",
                "Right to erasure — request deletion of your data where we no longer have a lawful basis to hold it",
                "Right to restrict processing — request that we limit how we use your data",
                "Right to data portability — receive your data in a structured, machine-readable format",
                "Right to object — object to processing based on legitimate interests or for direct marketing",
              ])}
              {p("To exercise any of these rights, email us at info@ptlaunchlab.co.uk with your request. We will respond within 30 days. We may need to verify your identity before processing your request.")}
              {p("If you are unhappy with how we handle your data, you have the right to lodge a complaint with the Information Commissioner's Office (ICO) at ico.org.uk or by calling 0303 123 1113.")}
            </>
          ),
        },
        {
          title: "Cookies",
          content: (
            <>
              {p("This website uses cookies to improve your experience and analyse how the site is used. Essential cookies are required for the site to function. Analytics and marketing cookies are only set with your explicit consent.")}
              {p("We use CookieYes to manage cookie consent on this website. When you first visit, you will be presented with a cookie banner allowing you to accept, reject or customise your preferences. Your preferences are stored and respected on all future visits.")}
              {p("You can update or withdraw your cookie consent at any time by clicking the 'Revisit Consent' button in the bottom-left corner of any page on this website.")}
              {p("For a full list of cookies used on this site, their purposes and durations, please refer to the cookie declaration managed by CookieYes.")}
            </>
          ),
        },
        {
          title: "Changes to This Policy",
          content: (
            <>
              {p("We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. The date at the top of this page indicates when it was last revised.")}
              {p("For significant changes, we will notify enrolled learners by email.")}
            </>
          ),
        },
      ]}
    />
  );
}
