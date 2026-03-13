import type { Metadata } from "next";
import LegalPage from "../components/LegalPage";

export const metadata: Metadata = {
  title: "Terms & Conditions | PT Launch Lab",
  description: "Terms and conditions for PT Launch Lab courses and services.",
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

export default function TermsPage() {
  return (
    <LegalPage
      label="Legal"
      title="Terms & Conditions"
      lastUpdated="March 2026"
      intro="Please read these terms carefully before enrolling. By completing your enrolment and making payment, you agree to be bound by these terms."
      sections={[
        {
          title: "About Us",
          content: (
            <>
              {p("PT Launch Lab provides online personal training education and career development courses, including the NCFE-accredited Level 2 Certificate in Gym Instructing and Level 3 Certificate in Personal Training.")}
              {p("For the purposes of these terms, \"PT Launch Lab\", \"we\", \"us\" and \"our\" refers to PT Launch Lab. You can contact us at info@ptlaunchlab.co.uk or 01977 365001.")}
            </>
          ),
        },
        {
          title: "Your Course",
          content: (
            <>
              {p("When you enrol you will receive access to the PT Launch Lab online learning programme, delivered via the Merve learning platform. Your course includes:")}
              {ul([
                "Access to all 12 course modules for the duration of your programme",
                "A dedicated personal tutor",
                "Business and marketing training",
                "Mentorship from the PT Launch Lab team",
                "Guaranteed gym interview support upon qualification",
                "NCFE qualification registration (Ofqual regulated, CIMSPA and REPs recognised)",
              ])}
              {p("Course access begins as soon as your payment is confirmed. The standard completion timeframe is 12–16 weeks, though you are able to study at your own pace.")}
            </>
          ),
        },
        {
          title: "Pricing & Payment",
          content: (
            <>
              {p("The following payment options are available at the time of enrolment:")}
              {ul([
                "Full Payment: £1,399 — single payment, immediate access",
                "Deposit Plan: £599 deposit followed by 5 monthly payments of £200 (total £1,599)",
                "Finance: available via Payl8r over 12–18 months — contact us for details",
              ])}
              {p("All prices are inclusive of VAT where applicable. Payments are processed securely via Stripe. PT Launch Lab does not store your card details.")}
              {p("If you choose the deposit plan, the monthly payments of £200 are due on the same date each month following your initial deposit. Failure to maintain payments may result in suspension of course access until payments are brought up to date.")}
            </>
          ),
        },
        {
          title: "Cooling Off Period & Cancellation",
          content: (
            <>
              {p("Under the Consumer Contracts (Information, Cancellation and Additional Charges) Regulations 2013, you have the right to cancel your enrolment within 14 calendar days of your payment without giving a reason (the \"cooling off period\").")}
              {p("To exercise your right to cancel, contact us at info@ptlaunchlab.co.uk within 14 days of payment. We will acknowledge your cancellation and process a full refund within 14 days of receiving your cancellation request.")}
              {p("After the 14-day cooling off period has expired, cancellations are not eligible for a refund except in exceptional circumstances at our discretion. Your statutory rights under UK consumer law are not affected.")}
              {p("If you choose the deposit plan and cancel after 14 days, the deposit and any payments already made are non-refundable. You will not be liable for any remaining monthly payments that have not yet been charged.")}
            </>
          ),
        },
        {
          title: "Refunds",
          content: (
            <>
              {p("Refunds will be issued to the original payment method within 14 days of an approved refund request.")}
              {p("We may offer a partial refund or course transfer at our discretion in circumstances including:")}
              {ul([
                "Serious illness or injury preventing you from studying (evidence required)",
                "A significant change to the course content that materially affects its value",
                "Failure on our part to deliver the course as described",
              ])}
              {p("Refunds will not normally be granted for change of mind after the cooling off period, lack of engagement, or failure to complete the course.")}
            </>
          ),
        },
        {
          title: "Learner Responsibilities",
          content: (
            <>
              {p("By enrolling you agree to:")}
              {ul([
                "Provide accurate personal information as required for NCFE qualification registration",
                "Engage actively with the learning materials and complete required coursework",
                "Treat tutors, mentors and staff with respect",
                "Not share login credentials or course materials with third parties",
                "Notify us promptly of any changes to your contact details",
              ])}
              {p("PT Launch Lab reserves the right to suspend or terminate a learner's access to the course without refund in cases of misconduct, fraudulent information, or persistent non-engagement after reasonable attempts to support the learner.")}
            </>
          ),
        },
        {
          title: "Accreditation & Qualification",
          content: (
            <>
              {p("The PT Launch Lab programme leads to the NCFE Level 2 Certificate in Gym Instructing and Level 3 Certificate in Personal Training. These qualifications are regulated by Ofqual and recognised by CIMSPA and REPs.")}
              {p("Qualification registration is subject to the learner providing a valid National Insurance number and meeting the entry requirements. PT Launch Lab acts as the approved centre for NCFE registration.")}
              {p("Certificates are issued by NCFE upon successful completion of all required assessments and coursework. PT Launch Lab does not guarantee the outcome of any assessment.")}
            </>
          ),
        },
        {
          title: "Gym Interview Guarantee",
          content: (
            <>
              {p("Upon successful qualification, PT Launch Lab will arrange at least one guaranteed interview with a partner gym. This guarantee applies to learners who have:")}
              {ul([
                "Completed and passed all course modules and assessments",
                "Engaged actively with the business and mentorship elements of the programme",
                "Updated their learner profile and CV as guided",
              ])}
              {p("This guarantee covers interview access only — PT Launch Lab cannot guarantee employment outcomes, which remain at the discretion of the individual gym.")}
            </>
          ),
        },
        {
          title: "Intellectual Property",
          content: (
            <>
              {p("All course materials, content, branding, and resources provided by PT Launch Lab are the intellectual property of PT Launch Lab and are protected by copyright.")}
              {p("You are granted a personal, non-transferable licence to access and use the materials for the purpose of completing your course. You may not reproduce, redistribute, sell, or share course materials with any third party.")}
            </>
          ),
        },
        {
          title: "Limitation of Liability",
          content: (
            <>
              {p("PT Launch Lab's liability to you in connection with your enrolment shall not exceed the total amount paid by you for your course.")}
              {p("We are not liable for any indirect, consequential, or economic losses including loss of income or employment opportunities arising from your enrolment or completion of the course.")}
              {p("Nothing in these terms excludes or limits our liability for death or personal injury caused by our negligence, fraud, or any other liability that cannot be excluded under UK law.")}
            </>
          ),
        },
        {
          title: "Changes to These Terms",
          content: (
            <>
              {p("We may update these terms from time to time. Where changes are material, we will notify enrolled learners by email. Continued use of course materials following notification constitutes acceptance of the updated terms.")}
              {p("The terms in force at the time of your enrolment govern your contract with us.")}
            </>
          ),
        },
        {
          title: "NCFE Awarding Body Policies",
          content: (
            <>
              {p("By enrolling on a PT Launch Lab course you will be registered as a learner with NCFE, the awarding organisation responsible for issuing your Level 2 and Level 3 qualifications.")}
              {p("Once registered, you are also subject to NCFE's own learner-facing policies, which cover:")}
              {ul([
                "Assessment regulations and requirements",
                "Appeals and complaints procedures",
                "Malpractice and maladministration policy",
                "Reasonable adjustments and special considerations",
                "Certification and results",
              ])}
              {p("NCFE's policies are available at ncfe.org.uk. PT Launch Lab, as an approved NCFE centre, is responsible for administering these policies on NCFE's behalf. If you have a concern relating to your qualification that cannot be resolved with PT Launch Lab, you have the right to escalate to NCFE directly.")}
            </>
          ),
        },
        {
          title: "Governing Law",
          content: (
            <>
              {p("These terms and any dispute arising from them are governed by the laws of England and Wales. Any disputes shall be subject to the exclusive jurisdiction of the courts of England and Wales.")}
              {p("If you are a consumer and resident in another part of the UK, you may also have rights under the law of that jurisdiction.")}
            </>
          ),
        },
      ]}
    />
  );
}
