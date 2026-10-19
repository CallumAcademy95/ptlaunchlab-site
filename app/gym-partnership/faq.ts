import { COURSE_PRICE_LABEL, MONTHLY_PLAN_LABEL, PARTNER_FEE_RELEASE_PAYMENT, formatPence } from "@/app/lib/pricing";
import {
  LADDER_MONTHLY_COMMISSION_PENCE,
  LADDER_PIF_COMMISSION_PENCE,
  VOLUME_BONUS_MONTHLY_PENCE,
  VOLUME_BONUS_PIF_PENCE,
  VOLUME_THRESHOLD,
} from "@/app/lib/partnerCommission";

// Gym-owner questions, written in the words gym owners search with. Rendered
// on /gym-partnership and emitted as FAQPage schema there. Every figure comes
// from the pricing/commission constants so it can't drift from the agreement.
const PIF_FEE = formatPence(LADDER_PIF_COMMISSION_PENCE);
const MONTHLY_FEE = formatPence(LADDER_MONTHLY_COMMISSION_PENCE);
const PIF_FEE_VOLUME = formatPence(LADDER_PIF_COMMISSION_PENCE + VOLUME_BONUS_PIF_PENCE);
const MONTHLY_FEE_VOLUME = formatPence(LADDER_MONTHLY_COMMISSION_PENCE + VOLUME_BONUS_MONTHLY_PENCE);

export const GYM_PARTNER_FAQ: { q: string; a: string }[] = [
  {
    q: "How do I add a PT academy to my gym?",
    a: "Apply on this page. We review your gym and confirm your area is free, then build your branded academy: your own landing page with your logo, a custom link and QR code, a printed poster and member handout, a video for your gym screens, and a ready-to-run Meta ad pack. You promote it to your members; we teach, assess and certify every learner.",
  },
  {
    q: "What does it cost my gym?",
    a: "Nothing. There is no licence fee, no setup fee and no stock to buy. You don't employ tutors or assessors, and you don't need to become an approved centre with an awarding body. We are paid by the learner, and your gym is paid a fee for every learner who enrols through your academy.",
  },
  {
    q: "How much does my gym earn per learner?",
    a: `${PIF_FEE} for each learner who pays in full and ${MONTHLY_FEE} for each learner on the monthly plan, rising to ${PIF_FEE_VOLUME} and ${MONTHLY_FEE_VOLUME} from your ${VOLUME_THRESHOLD}th learner in a calendar quarter. All fees include VAT. Pay-in-full fees are paid 30 days after enrolment; monthly-plan fees are paid when the learner's ${PARTNER_FEE_RELEASE_PAYMENT}th payment clears. Nothing is clawed back once paid.`,
  },
  {
    q: "What qualification do learners get?",
    a: `NCFE Level 2 Gym Instructing and Level 3 Personal Training, both Ofqual-regulated and recognised by UK gyms and insurers. Learners pay ${COURSE_PRICE_LABEL} in full or ${MONTHLY_PLAN_LABEL}, and the course includes our Mentorship Hub to take them from qualified to their first paying clients.`,
  },
  {
    q: "Do my staff have to teach or assess the course?",
    a: "No. Teaching, tutor support, assessments, quality assurance, paperwork and certification are all handled by PT Launch Lab. Your role is to promote the academy to your members and, if you want to, offer qualified learners a route onto your gym floor.",
  },
  {
    q: "Is it really branded as my gym's academy?",
    a: "Yes. To your members it is \"[Your Gym] PT Academy\", with your name, logo and colours on the landing page, poster, handout, screen video and ads.",
  },
  {
    q: "How is this different from licensing a PT course?",
    a: "With a licence or approved-centre model, the gym usually delivers the course itself: it needs qualified tutors and assessors, has to meet the awarding body's quality assurance, and carries the cost of teaching. With the PT Launch Lab partnership, we deliver everything and the gym is paid per learner, so there is no teaching load and no upfront cost.",
  },
  {
    q: "How many partner gyms do you take in each area?",
    a: "One. Each partner gym gets its area to itself, so we won't sign a competing gym nearby. Areas are allocated as applications come in.",
  },
];

export const gymPartnerFaqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: GYM_PARTNER_FAQ.map(({ q, a }) => ({
    "@type": "Question",
    name: q,
    acceptedAnswer: { "@type": "Answer", text: a },
  })),
};
