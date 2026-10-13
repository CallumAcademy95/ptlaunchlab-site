// The three /vsl ad landing pages' copy, one object per avatar. The layout is
// app/vsl/VslPage.tsx; each app/vsl/*/page.tsx keeps its own metadata and
// renders <VslPage content={VSL_CONTENT.<avatar>} />.
//
// Copy is verbatim from the pages as they were before Phase 3b (12 Oct 2026),
// except: the hero (new H1 and a one-sentence subline), the pricing intro (pay
// in full first, then a factual monthly line), and the affordability lines
// that sold the monthly plan (what a weekly PT session or a school term covers,
// the household budget), which are gone. tests/phase3b.test.mts keeps them out.
//
// Plain data with relative .ts imports so the unit tests can import it.

import {
  COURSE_PRICE_LABEL,
  MONTHLY_PRICE_LABEL,
  MONTHLY_PAYMENTS,
  MONTHLY_PLAN_TOTAL_PENCE,
  formatPence,
} from "../lib/pricing.ts";

export type VslAvatar = "starter" | "switcher" | "returner";

/** Two-line section heading: `lead`, a line break, then `pre` + gold `gold`. */
export type Heading = { lead: string; pre?: string; gold: string };
/** A paragraph that may end in a white, bold phrase. */
export type Para = { text: string; strong?: string };
type Card = { tag: string; title: string; body: string };

export type VslContent = {
  avatar: VslAvatar;
  pageUrl: string;
  breadcrumbName: string;
  quizHref: string;
  youtubeId: string;
  hero: { headline: string; goldTail: string; subline: string };
  schema: {
    courseName: string;
    courseDescription: string;
    courseWorkload: string;
    articleHeadline: string;
    articleDescription: string;
  };
  forYouIf: string[];
  forYouOutro: string;
  empathy: { heading: Heading; paras: Para[] };
  skipQuiz: { eyebrow: string; gold: string; body: string };
  founders: { eyebrow: string; heading: Heading; quotes: { callum: string; ryan: string; miles: string } };
  /** starter: the pathway rows (tag on the left); others: a 2×2 grid of cards. */
  pathway: { layout: "rows" | "grid"; eyebrow: string; heading: Heading; intro: string; items: Card[] };
  comparison: { heading: Heading; intro: string; rows: { other: string; us: string }[] };
  future: { eyebrow: string; heading: Heading; lines: string[] };
  objections: { eyebrow: string; heading: Heading; items: { q: string; a: string }[] };
  steps: { eyebrow: string; heading: Heading; intro: string; items: { n: number; title: string; body: string }[] };
  learnerStripLabel: string;
  pricingIntro: string;
  proofHeading: string;
  faqHeading: string;
  faqs: { q: string; a: string }[];
  close: { eyebrow: string; heading: Heading; intro: string; footnote: string };
};

const FOUNDERS_VIDEO = "0rhp9fkBFsU";

/** "Or 10 monthly payments of £99.99, the first taken today (£999.90 in total)." */
const MONTHLY_FACT = `Or ${MONTHLY_PAYMENTS} monthly payments of ${MONTHLY_PRICE_LABEL}, the first taken today (${formatPence(MONTHLY_PLAN_TOTAL_PENCE)} in total).`;
/** Pay in full first, then the monthly plan, as a plain statement. */
const BOTH_WAYS = `${COURSE_PRICE_LABEL} in full, or ${MONTHLY_PAYMENTS} monthly payments of ${MONTHLY_PRICE_LABEL}.`;

const starter: VslContent = {
  avatar: "starter",
  pageUrl: "https://ptlaunchlab.co.uk/vsl/become-a-personal-trainer-uk",
  breadcrumbName: "Become a Personal Trainer UK",
  quizHref: "/quiz?avatar=starter",
  youtubeId: FOUNDERS_VIDEO,
  hero: {
    headline: "Become a qualified Personal Trainer,",
    goldTail: "around your job.",
    subline: "NCFE Level 2 + Level 3, fully online, no degree, taught by gym owners who've personally hired 500+ PTs into real gyms across the UK.",
  },
  schema: {
    courseName: "NCFE Level 2 & Level 3 Diploma in Gym Instructing and Personal Training",
    courseDescription: "Become a qualified UK Personal Trainer with an Ofqual-regulated NCFE Level 2 Gym Instructor and Level 3 Personal Trainer diploma. Fully online, includes business mentorship and a guaranteed gym introduction on graduation.",
    courseWorkload: "P8W",
    articleHeadline: "Become a Personal Trainer in the UK — Level 2 & 3 Course (Online)",
    articleDescription: "Turn your gym obsession into a recognised career. NCFE Level 2 & 3, Ofqual regulated, fully online.",
  },
  forYouIf: [
    "You practically live in the gym already",
    "Your mates already ask you for programme advice",
    "You don't want a desk job, and university isn't the move",
    "You've thought about PT for months but Reddit keeps confusing you",
    "You want a career you'd actually talk about at a dinner party",
    "You're worried half the courses online are a scam",
  ],
  forYouOutro: "If you ticked four or more, you're not browsing. You're closer than you think. If that's you, keep reading.",
  empathy: {
    heading: { lead: "You're going to be in a gym", gold: "for the rest of your life anyway." },
    paras: [
      { text: "You think about training when you're at work. You schedule your week around your sessions. Your mates already ping you about programmes, lifts they can't get right, food questions you answer off the top of your head." },
      { text: "And somewhere in the back of your head there's a quiet voice saying: ", strong: "why am I not getting paid for this?" },
      { text: "The honest answer is usually the same one. You don't know which qualification is real. You don't know if you're “expert enough.” You don't know what happens after you qualify. The rest of this page is the straight answer to all three." },
    ],
  },
  skipQuiz: {
    eyebrow: "Already decided?",
    gold: "Talk to a real person.",
    body: "If you already know PT is for you, drop your details. We'll WhatsApp you a quick intro, and you can book your call straight after.",
  },
  founders: {
    eyebrow: "Run by gym owners",
    heading: { lead: "Not lecturers.", gold: "People who've actually hired you." },
    quotes: {
      callum: "I built the course I wish had existed when I started.",
      ryan: "We've hired 500+ PTs. We know exactly what gyms look for.",
      miles: "Qualification is step one. The business is what pays you.",
    },
  },
  pathway: {
    layout: "rows",
    eyebrow: "The bit Reddit gets wrong",
    heading: { lead: "You don't pick “Level 3.”", gold: "You do Level 2, then Level 3." },
    intro: "Half the cheap courses advertise “Level 3” then make you buy Level 2 separately when you're already invested. Ours doesn't. Here's the actual pathway, with no asterisks.",
    items: [
      { tag: "Step 1", title: "Level 2 Gym Instructor (legal prerequisite)", body: "Anatomy, physiology, gym floor coaching, client inductions. You can't take Level 3 without it. Included in your fee." },
      { tag: "Step 2", title: "Level 3 Personal Trainer", body: "Programming, nutrition, business planning, practical coaching. This is the one UK gym managers ask for by name." },
      { tag: "Awarded by", title: "NCFE, Ofqual reference 603/4388/6", body: "On the UK government's public register of regulated qualifications, which is what a hiring manager checks." },
      { tag: "Then", title: "CIMSPA + public liability insurance", body: "Register with CIMSPA, get insured (~£60/year), legally take paying 1-to-1 clients anywhere in the UK." },
    ],
  },
  comparison: {
    heading: { lead: "Most PT courses", gold: "stop at the certificate." },
    intro: "That's why 80% of UK PTs quit inside 18 months. They qualified. They just didn't learn the rest of the job.",
    rows: [
      { other: "Just a certificate, and the rest to figure out yourself", us: "Certificate + personal tutor + business mentorship" },
      { other: "No help getting hired", us: "Warm intros into our partner gym network" },
      { other: "Run by lecturers, not practitioners", us: "Run by gym owners who've hired 500+ PTs" },
      { other: "No business training", us: "£500 Mentorship Hub bundled free" },
      { other: "Help-desk ticket if you get stuck", us: "Your tutor's a message away, with answers in hours rather than days" },
      { other: "Surprise upsell fees post-enrolment", us: `${COURSE_PRICE_LABEL} total. Nothing sold as a paid upgrade later` },
    ],
  },
  future: {
    eyebrow: "12 months from now",
    heading: { lead: "The version of you", gold: "that this is actually about." },
    lines: [
      "You're walking into a gym you actually want to be in, and you work there.",
      "Your first paying client just rebooked. They're texting you about their week. You're answering as a coach, not a mate.",
      "Someone at a party asks what you do, and the answer is interesting for once.",
      "You're earning from the thing you'd be doing on a Sunday anyway.",
      "Your mum has stopped asking when you'll get a 'proper job.'",
      "You're not scrolling Reddit asking if PT is worth it. You're the person Reddit is asking.",
    ],
  },
  objections: {
    eyebrow: "The things you're actually worried about",
    heading: { lead: "Straight answers.", gold: "No PR voice." },
    items: [
      {
        q: "What if I've never coached anyone before?",
        a: "You don't need to have. The course starts at the foundations: anatomy, how a squat actually works, how to read a body, how to write a programme. We've put learners through who'd never coached a single person and watched them walk into their first session shaking and walk out with rebookings. The skill is taught. The job is just turning up to learn it.",
      },
      {
        q: "Won't the industry just spit me out? Isn't it saturated?",
        a: "The UK has 11.5 million gym members across 7,200+ gyms. There's no shortage of clients. There's a shortage of PTs who know how to find them, which is why 80% of newly-qualified UK PTs quit inside 18 months. That's the gap the £500 Mentorship Hub (free with your course) is built to close. You don't compete with the cert-only PTs. You out-position them.",
      },
      {
        q: "Am I really qualified enough? I haven't got abs / a degree / a sport science background.",
        a: "None of that matters. UK gym hiring managers ask for NCFE Level 3 by default on their job listings, not for abs or a degree. That's exactly what you walk away with. Confidence comes from competence, not aesthetics. Your tutor reviews every unit you submit and either passes it or sends it back with feedback, so the qualification itself stops feeling intimidating fast.",
      },
      {
        q: "How do I know this isn't another £29 PDF scam?",
        a: "Two checks: (1) the qualification is on the Ofqual Register, the UK government's public list of regulated qualifications, under reference 603/4388/6. (2) The awarding body is NCFE, the qualification name UK gym managers list by default on hiring posts. Anything outside Ofqual is CPD, not a qualification. We're the regulated route.",
      },
    ],
  },
  steps: {
    eyebrow: "The PT Launch Method™",
    heading: { lead: "From gym regular", gold: "to qualified PT." },
    intro: "8–16 weeks on average. Faster if you push, slower if life gets in the way. Your timeline, your call.",
    items: [
      { n: 1, title: "Enrol, and your tutor lands within 24 hours", body: "Immediate access to the learning app. No cohort start dates. Your tutor is a real person, not a help desk. Most learners are messaging them by day two." },
      { n: 2, title: "Smash Level 2: Gym Instructor", body: "Anatomy, physiology, gym floor coaching, client consultations. The legal prerequisite for Level 3, already included in your fee rather than sold separately." },
      { n: 3, title: "Move into Level 3: Personal Trainer", body: "Programming, nutrition, business planning. Video-assessed practicals: film yourself coaching real movements at any gym and your tutor reviews the footage." },
      { n: 4, title: "Qualify: NCFE, Ofqual regulated", body: "The qualification UK gym managers ask for by default. Register with CIMSPA, get insured (~£60/year), become a legally practising UK PT." },
      { n: 5, title: "Get your warm introduction to a gym", body: "We've personally hired 500+ PTs across our partner gym network. A warm introduction rather than a cold CV drop." },
      { n: 6, title: "Build your client base via the Mentorship Hub", body: "Niche, pricing, marketing, first 10 clients. The £500 PT Launch Lab Mentorship Hub is bundled free: your dashboard from 'qualified' to 'fully booked.'" },
    ],
  },
  learnerStripLabel: "Real learners · Real careers",
  pricingIntro: `${COURSE_PRICE_LABEL}, everything included: Level 2, Level 3, your tutor, the £500 Mentorship Hub, and a warm introduction to our gym network. ${MONTHLY_FACT}`,
  proofHeading: "People who started right where you are",
  faqHeading: "Quick-fire questions.",
  faqs: [
    { q: "How do you become a personal trainer in the UK?", a: `Two qualifications: NCFE Level 2 Gym Instructor (legal prerequisite) followed by NCFE Level 3 Personal Trainer. Both Ofqual regulated, both bundled in our ${COURSE_PRICE_LABEL} course. Once you've passed Level 3 you register with CIMSPA, get public liability insurance (~£60/year), and you can legally take paying 1-to-1 clients in any UK commercial gym. No degree required. No minimum age above 16.` },
    { q: "Do I need Level 2 if I just want to do Level 3?", a: `Yes. Level 2 is the legal prerequisite for Level 3 Personal Trainer. Some providers quote a 'Level 3 only' price to look cheap, then bolt Level 2 on as a £500 extra. Our ${COURSE_PRICE_LABEL} fee includes both. One fee, one tutor, one finish line.` },
    { q: "Will gyms actually hire me with this qualification?", a: "NCFE Level 3 is regulated by Ofqual under reference 603/4388/6 and sits on the public register, which is what a hiring manager is checking for. Our team has personally hired 500+ PTs, so we know what they look for. When you qualify we approach at least one gym on your behalf: either with a gym in our partner network, or with a gym local to you that we approach on your behalf." },
    { q: "Can I afford it?", a: `You can pay ${COURSE_PRICE_LABEL} in full, or ${MONTHLY_PAYMENTS} monthly payments of ${MONTHLY_PRICE_LABEL} with no interest.` },
    { q: "Can I really do this online from home?", a: "Yes. 100% online. Theory online, practicals via video assessment (you film yourself coaching at any gym, tutor reviews remotely). NCFE, Focus Awards, and Active IQ all accept video assessment. What matters is the qualification itself, not the room you were sitting in when you earned it." },
    { q: "When can I start?", a: "Immediately. Full access opens the moment you enrol. Your tutor is introduced within 24 hours. There's no cohort start date, and many learners are halfway through their first unit by the end of day one." },
  ],
  close: {
    eyebrow: "Ready to start?",
    heading: { lead: "Two routes in.", gold: "Same destination." },
    intro: "Pick the one that feels right. Both lead to a career you actually want.",
    footnote: "Tutor introduced within 24 hours · No commitment · Cancel anytime in your first 7 days",
  },
};

const switcher: VslContent = {
  avatar: "switcher",
  pageUrl: "https://ptlaunchlab.co.uk/vsl/career-change-to-personal-trainer",
  breadcrumbName: "Career Change to Personal Trainer",
  quizHref: "/quiz?avatar=switcher",
  youtubeId: FOUNDERS_VIDEO,
  hero: {
    headline: "Change career to Personal Trainer,",
    goldTail: "around your current job.",
    subline: "NCFE Level 2 + Level 3, Ofqual regulated and fully online, with the business mentorship included.",
  },
  schema: {
    courseName: "NCFE Level 2 & Level 3 Diploma in Gym Instructing and Personal Training (Career Change Pathway)",
    courseDescription: "Career-change-to-PT pathway for working UK adults. Study around a full-time job, qualify in 8–16 weeks, includes business mentorship and warm introductions into employed PT roles.",
    courseWorkload: "P12W",
    articleHeadline: "Career Change to Personal Trainer (UK) — Qualify Without Quitting Your Job",
    articleDescription: "Realistic UK route from desk job to PT. Study around work. Business mentorship included. Transition safely.",
  },
  forYouIf: [
    "You're burnt out in corporate, hospitality, sales, retail or shift work",
    "You're working hard for a future that isn't yours",
    "Fitness has been the one thing you keep coming back to",
    "You can't quit yet, because there's a mortgage or kids or rent",
    "You've thought 'I should be doing this for a living' more than once",
    "You want a believable transition, not a quit-your-job-on-Monday fantasy",
  ],
  forYouOutro: "If you ticked four or more, you're not browsing. You're stuck. The rest of this page is the route out.",
  empathy: {
    heading: { lead: "You're good at working hard.", gold: "You're working hard for something you no longer want." },
    paras: [
      { text: "The Sunday-night dread is back. The 6:45 alarm has stopped feeling normal. You're checking your phone in meetings, doing the bare minimum, and wondering when this stopped being your life." },
      { text: "And every time it gets bad you do the same thing. You go to the gym. That hour at lunchtime, the early session before work, the late evening when the office finally goes quiet. ", strong: "Fitness has been the one thing that's never let you down." },
      { text: "You're not going to wake up next year and find that the desk has gotten better. The question stops being “should I change careers” and starts being “what does a realistic exit actually look like.”" },
    ],
  },
  skipQuiz: {
    eyebrow: "Already decided?",
    gold: "Map your transition with the team.",
    body: "If you already know PT is the move, drop your details. We'll WhatsApp you a quick intro, and you can book a 15-min transition call straight after.",
  },
  founders: {
    eyebrow: "Run by gym owners",
    heading: { lead: "We've hired the PT", gold: "you're about to become." },
    quotes: {
      callum: "Career-changers in their 30s & 40s outperform everyone else when they get the business side.",
      ryan: "Most PTs fail because nobody taught them the business. We built the course we wish had existed.",
      miles: "You don't need a sales personality. You need a sales process. We give you one.",
    },
  },
  pathway: {
    layout: "grid",
    eyebrow: "Designed around real life",
    heading: { lead: "No quitting on Monday.", gold: "No financial freefall." },
    intro: "Every single piece of this course is built to be done on top of a full-time job, including how you study around your shifts.",
    items: [
      { tag: "Hours", title: "8–10 hours a week, on your terms", body: "100% online. No fixed class times, no commute, no commitments outside your control. Most learners study evenings and weekends." },
      { tag: "Cost", title: "One fee, everything included", body: BOTH_WAYS },
      { tag: "Support", title: "Real tutor, not a help-desk ticket", body: "Personal tutor introduced within 24 hours. Reviews every unit you submit and either passes it or sends it back with feedback, so the assessments stop being scary." },
      { tag: "Exit", title: "Employed-first, then self-employed", body: "A warm introduction into our partner gym network. Overlap salaries while you build your client base. No leap-of-faith required." },
    ],
  },
  comparison: {
    heading: { lead: "Most PT courses", gold: "aren't built for working adults." },
    intro: "They're built for 18-year-old college kids in classrooms. You need something different.",
    rows: [
      { other: "Built for school-leavers in classrooms", us: "Built for working adults: online and self-paced" },
      { other: "Quit your job to study full-time", us: "Study evenings + weekends while you keep earning" },
      { other: "Just a certificate, and clients to figure out alone", us: "£500 Mentorship Hub bundled free" },
      { other: "Lecturer telling you the theory", us: "Gym owners who've personally hired 500+ PTs" },
      { other: "Cold CV drops once you qualify", us: "Warm intros to salaried roles in our network" },
      { other: "Surprise upsell fees post-enrolment", us: `${COURSE_PRICE_LABEL} total. Nothing sold as a paid upgrade later` },
    ],
  },
  future: {
    eyebrow: "18 months from now",
    heading: { lead: "The Tuesday morning", gold: "that doesn't feel like a chore." },
    lines: [
      "Your alarm goes off and you're walking into a gym you chose, rather than a job you tolerate.",
      "Your 8am client just rebooked for next week. The 10am cancelled and rescheduled. You're booked-out by lunchtime.",
      "You're paying the mortgage off PT income that finally crossed your old salary.",
      "Your friends from the old job ask how you did it. You tell them honestly: the qualification, the Mentorship Hub, the gym introduction, the slow overlap.",
      "You haven't opened that payroll software in 14 months.",
      "You're earning from work that doesn't hollow you out.",
    ],
  },
  objections: {
    eyebrow: "The four things actually stopping you",
    heading: { lead: "Honest answers", gold: "to honest worries." },
    items: [
      {
        q: "I can't quit my job to retrain. Is this actually doable around full-time work?",
        a: "Yes, and it's how most of our career-changers do it. The course is fully online, fully self-paced, with no fixed class times. Theory units fit around evenings and lunch breaks; practical units are video-assessed at any gym, on your schedule. Average study load is 8–10 hours a week. Most career-changers finish Level 2 + Level 3 in 8–16 weeks while still earning full-time. You don't quit. You qualify, then you transition.",
      },
      {
        q: "Isn't the PT industry saturated? Will there even be space for me?",
        a: "The industry is saturated with PTs who never learned how to get clients. Roughly 80% of newly-qualified UK PTs quit inside 18 months. They didn't fail at training. They failed at marketing, pricing and client retention, which is the bit nobody taught them. Our £500 Mentorship Hub is built specifically to close that gap, bundled free with your course. You don't compete with the cert-only PTs. You skip past them.",
      },
      {
        q: "I'm not 'salesy.' Will I have to do the cringe gym-floor pitch?",
        a: "No. Plenty of our most successful learners came from quiet, technical, non-sales backgrounds. The Mentorship Hub walks you through the conversations, the pricing, the messaging, the social posts, as a system rather than as a personality. You don't need a sales personality. You need a sales process. We give you one.",
      },
      {
        q: "What if the income doesn't replace my current salary?",
        a: "Employed-first is the safer bridge. We approach at least one gym on your behalf when you qualify: either with a gym in our partner network, or with a gym local to you that we approach on your behalf. Year one salary: £20K–£28K base plus commission. You stay in your current job long enough to overlap salaries, then transition. Self-employed PTs after 2–3 years routinely hit £35K–£50K+. The pathway is gradual, not a cliff edge.",
      },
    ],
  },
  steps: {
    eyebrow: "Your transition plan",
    heading: { lead: "Six steps.", gold: "No gamble. No cliff edge." },
    intro: "Most career-changers finish in 8–16 weeks while still earning full-time, then transition employed-first before going solo.",
    items: [
      { n: 1, title: "Book a free 15-min call", body: "Tell us your situation honestly. Current role, hours, financial pressure, when you want to be out. We'll tell you if the maths actually works, and if it doesn't." },
      { n: 2, title: "Enrol in minutes, pay in full or monthly", body: BOTH_WAYS },
      { n: 3, title: "Study evenings and weekends, and keep earning", body: "Tutor introduced within 24 hours. Average 8–10 hours per week alongside full-time work. Level 2 done in ~4 weeks, Level 3 in another ~6–8." },
      { n: 4, title: "Qualify: NCFE, Ofqual regulated", body: "The qualification UK gym managers ask for by name. Register with CIMSPA, get insured (~£60/year), legally take paying 1-to-1 clients anywhere in the UK." },
      { n: 5, title: "Transition employed-first, with a warm gym introduction", body: "We've personally hired 500+ PTs through our network. A warm introduction into a salaried PT role rather than a cold CV drop. Overlap salaries while you build your client base." },
      { n: 6, title: "Scale via the Mentorship Hub when ready", body: "When your client roster outgrows your old salary, leave the day job. Hub walks you through pricing, packaging, retention. Most career-changers replace their salary inside 6–12 months." },
    ],
  },
  learnerStripLabel: "Real career-changers · Real PT careers",
  pricingIntro: `${COURSE_PRICE_LABEL}, everything included: Level 2, Level 3, your tutor, the £500 Mentorship Hub, and warm gym intros. ${MONTHLY_FACT}`,
  proofHeading: "Career-changers who were exactly where you are",
  faqHeading: "Working-adult questions, answered.",
  faqs: [
    { q: "Can I really qualify as a personal trainer while working full-time in the UK?", a: "Yes. 100% online and fully self-paced. No fixed class times, no commute, no weekend workshops. Practical units are video-assessed at any gym: you film yourself coaching real movements and your tutor reviews it. Most career-changers put in 8–10 hours per week and finish in 8–16 weeks while still earning full-time." },
    { q: "Is it too late to change careers in my 30s or 40s?", a: "No, and the UK PT market actively rewards career-changers in this age bracket. Life experience, professional sales instinct from your existing job, and the maturity to actually run a business are advantages younger PTs haven't built. Clients in their 30s–50s consistently prefer a PT who relates to them. We've put learners through in their late 50s and they're working." },
    { q: "How much can I realistically earn as a PT in year one?", a: "Employed at a commercial gym: £20K–£28K base in year one, plus session commission. Self-employed on a rent-a-space deal: £25K–£45K in year one if you actively market. Established self-employed PTs after 2–3 years regularly earn £35K–£50K+. The Mentorship Hub is built specifically to compress that timeline by teaching the business side from day one." },
    { q: "What if I don't want to be self-employed?", a: "Employed-first is a real route. We approach at least one gym on your behalf when you qualify: either with a gym in our partner network, or with a gym local to you that we approach on your behalf. Plenty of career-changers stay salaried for 12–18 months, then either stay or transition. There's no requirement to go solo." },
    { q: "What does the £500 Mentorship Hub include?", a: "Your private dashboard built around one job: walking you from qualified to fully booked. Modules on niche, offer design, pricing, sales conversations, marketing, social media, and client retention. Templates, scripts and contracts. Bundled free with your course, in the fee rather than sold on afterwards." },
    { q: "When can I start?", a: "Immediately. The moment you enrol, your course access opens and your tutor introduces themselves within 24 hours. No cohort start dates. Most career-changers start the evening they sign up and have their first unit done by the weekend." },
  ],
  close: {
    eyebrow: "Ready to make a move?",
    heading: { lead: "Two routes out.", gold: "Both believable." },
    intro: "Pick the one that matches where you actually are. We'll handle the rest.",
    footnote: "No commitment · Tutor introduced within 24 hours · Cancel anytime in your first 7 days",
  },
};

const returner: VslContent = {
  avatar: "returner",
  pageUrl: "https://ptlaunchlab.co.uk/vsl/retrain-as-a-personal-trainer",
  breadcrumbName: "Retrain as a Personal Trainer",
  quizHref: "/quiz?avatar=returner",
  youtubeId: FOUNDERS_VIDEO,
  hero: {
    headline: "Retrain as a Personal Trainer,",
    goldTail: "from home.",
    subline: "NCFE Level 2 + Level 3, Ofqual regulated and fully online, built for parents and returners and taught with kindness.",
  },
  schema: {
    courseName: "NCFE Level 2 & Level 3 Diploma in Gym Instructing and Personal Training (Returner Pathway)",
    courseDescription: "Online UK PT qualification for parents and returners. Study from home around school hours and family life. Ofqual-regulated NCFE Level 2 + 3 with business mentorship and supportive tutor model.",
    courseWorkload: "P16W",
    articleHeadline: "Retrain as a Personal Trainer (UK) — Online Course Around the Kids",
    articleDescription: "Build a fitness career around school hours and family. Online UK NCFE Level 2 + 3, supportive route for parents and returners.",
  },
  forYouIf: [
    "You've put everyone else first for years and fitness is the one thing you've kept",
    "You're returning to work after kids, caring, illness, or a quiet rebuild",
    "You're 35, 40, 50 and quietly wondering if it's already too late",
    "You want work that fits the school run, not the other way round",
    "You've been the woman who shows up at the gym at 6am or 9:30am consistently",
    "Other women already ask you what you eat, how you train, how you keep going",
  ],
  forYouOutro: "If four or more of those felt like reading your own thoughts, keep going. The rest of this page is for you, specifically.",
  empathy: {
    heading: { lead: "You've spent years", pre: "putting ", gold: "everyone else first." },
    paras: [
      { text: "The kids needed you, the partner needed you, the parents needed you, the job needed you. Somewhere in the middle of all that you stopped being the centre of any decision, and you got quietly good at not being it." },
      { text: "And the one thing that didn't leave was the gym. The 6am session before they wake up. The 9:30 slot when they're at school. The Sunday morning run that's yours and yours only. ", strong: "Fitness has been the place where you've quietly stayed yourself." },
      { text: "You don't need to find your identity. You've been protecting it the whole time. You just need permission to build a career around it, and someone competent walking with you while you do." },
    ],
  },
  skipQuiz: {
    eyebrow: "Already feel this is for you?",
    gold: "Have a kind chat with the team.",
    body: "If you already know this is the move, drop your details. We'll WhatsApp a gentle hello, and you can book a no-pressure 15-min chat straight after.",
  },
  founders: {
    eyebrow: "Run by gym owners · taught with kindness",
    heading: { lead: "Real people.", gold: "Who know your situation." },
    quotes: {
      callum: "Our most successful learners are often parents and returners. Life experience is the advantage.",
      ryan: "We built this so studying again doesn't feel intimidating. Real tutors, real kindness.",
      miles: "You don't need an Instagram following. You need a local practice. We'll show you how.",
    },
  },
  pathway: {
    layout: "grid",
    eyebrow: "Designed around your life",
    heading: { lead: "No commute. No classroom.", gold: "No turning your life upside down." },
    intro: "Every piece of this course was built knowing you have school runs, bedtimes, dinners to cook, and a household that doesn't pause for your study. The course fits around your life, not the other way round.",
    items: [
      { tag: "Time", title: "Whenever they're not awake or there", body: "100% online. While they're at school, after bedtime, weekend mornings: your hours, your pace. Most returners finish in 8–16 weeks." },
      { tag: "Money", title: "One fee, everything included", body: BOTH_WAYS },
      { tag: "Support", title: "A real tutor, not a help desk", body: "Personal tutor introduced within 24 hours. Reviews every unit you submit and either passes it or sends it back with feedback. Resubmissions are free." },
      { tag: "Confidence", title: "We rebuild it on purpose", body: "The Mentorship Hub teaches the version of confidence you need when you've been out of the workforce." },
    ],
  },
  comparison: {
    heading: { lead: "Most PT courses", gold: "aren't built for you." },
    intro: "They're built for 18-year-olds with no kids and unlimited evenings. You need something kinder, more flexible, and built around real life.",
    rows: [
      { other: "Built for 18-year-olds with no kids", us: "Built for parents and returners, fully online" },
      { other: "Classroom hours that don't fit family life", us: "Self-paced from home: school hours, bedtimes, weekends" },
      { other: "No business support, so you fend for yourself", us: "£500 Mentorship Hub bundled free" },
      { other: "Bro-energy, hyper-aggressive branding", us: "Supportive, kind, built for confidence rebuilding" },
      { other: "'Become an Instagram influencer' marketing", us: "Local, referral-based, sustainable PT practice" },
      { other: "Help-desk ticket if you fall behind", us: "A real tutor who knows your name and your goals" },
    ],
  },
  future: {
    eyebrow: "12 months from now",
    heading: { lead: "School run, then your client,", gold: "then home for the next." },
    lines: [
      "You drop them off and go straight to your 9:30 client, a woman the same age as you, lifting heavier than she has in a decade.",
      "Your second client texts to say she's finally sleeping again. You wrote her a programme three weeks ago. She means it.",
      "You're home in time for pickup. The bills are paid this month from work you actually believe in.",
      "Another school-gate mum asks how much you charge. You tell her the price without flinching. She books.",
      "Your partner stops asking when you're going back to your 'old job.' You don't have an old job anymore.",
      "You're not waiting for permission to be useful. You're being useful, every day, to women who needed someone exactly like you.",
    ],
  },
  objections: {
    eyebrow: "The things you're quietly worried about",
    heading: { lead: "Said out loud,", gold: "answered kindly." },
    items: [
      {
        q: "Have I left it too late? I'm in my 40s.",
        a: "No. Some of the most successful PTs we work with are women in their 30s, 40s and 50s, and the market actively prefers them for the clients who matter most. A 45-year-old woman who's just had a baby doesn't want a 22-year-old man coaching her squat. She wants someone who's lived a body like hers. Life experience is the unfair advantage, not the obstacle. We've put learners through in their late 50s who are now running thriving local coaching businesses.",
      },
      {
        q: "Can I actually do this around the kids?",
        a: "Yes, and it's how the majority of returner students do it. The course is fully online and fully self-paced. No fixed class times, no in-person workshops, no commute. You log in while they're at school, while the baby naps, after bedtime, on a Saturday morning while your partner has them. Practical units are video-assessed at any local gym (a quiet weekday slot is ideal). Most returners finish in 8–16 weeks.",
      },
      {
        q: "I haven't studied in years. What if I can't cope?",
        a: "Your tutor is introduced within 24 hours of enrolment and stays with you for the whole course. You submit each unit when you're ready and your tutor either passes it or sends it back with feedback on what to change, so a unit that isn't quite there yet comes back for another go rather than counting as a fail. Resubmissions are included at no extra cost. You're not relearning how to be a student alone. There's a real person walking with you.",
      },
      {
        q: "Do I have to become an Instagram influencer to make this work?",
        a: "No, and please don't try. The most sustainable returner-PT businesses are built locally on referrals, school-gate trust, and word-of-mouth. The £500 Mentorship Hub (free with your course) teaches you how to build a small, profitable, niched client base in women's strength, postnatal recovery, midlife fitness or beginner confidence, without ever doing a transition reel. You're not building a brand. You're building a practice.",
      },
    ],
  },
  steps: {
    eyebrow: "Your route back",
    heading: { lead: "Six steps.", gold: "No drama. Your pace." },
    intro: "Most returners finish in 8–16 weeks fitting study around school runs, bedtimes, and weekends. Faster if you've got the energy, slower if life gets in the way. Your call entirely.",
    items: [
      { n: 1, title: "Book a free 15-min chat, no pressure", body: "Tell us your situation: kids' ages, what time you've actually got, what's pulling you towards PT. We'll listen first, then tell you honestly if it's the right move." },
      { n: 2, title: "Enrol in minutes, pay in full or monthly", body: BOTH_WAYS },
      { n: 3, title: "Study from home, on your hours", body: "100% online. Tutor introduced within 24 hours. While they're at school, after bedtime, weekend mornings. Entirely your call." },
      { n: 4, title: "Smash Level 2: Gym Instructor", body: "Anatomy, physiology, gym floor coaching, client consultations. The legal prerequisite, already included in your fee, with full tutor support." },
      { n: 5, title: "Qualify in Level 3: NCFE, Ofqual regulated", body: "Programming, nutrition, business planning, video-assessed practicals. The qualification UK gyms and insurers both recognise by default." },
      { n: 6, title: "Launch the business YOU want, locally", body: "Mentorship Hub walks you through niching, local marketing, pricing, packaging, and your first 10 clients. Women's strength, postnatal, midlife: your call." },
    ],
  },
  learnerStripLabel: "Real returners · Real PT careers",
  pricingIntro: `${COURSE_PRICE_LABEL}, everything included: Level 2, Level 3, your tutor, the £500 Mentorship Hub, and the introduction we make when you qualify. ${MONTHLY_FACT}`,
  proofHeading: "People who came back to fitness, just like you",
  faqHeading: "The questions returners ask.",
  faqs: [
    { q: "Is 40 too old to retrain as a personal trainer in the UK?", a: "No. The UK PT market has a genuine shortage of qualified coaches who understand busy parents, midlife bodies, and women's specific goals. Clients in their 30s, 40s, and 50s consistently prefer a PT who relates to them. We've put learners through in their late 50s who are now coaching full diaries. The blocker is confidence rather than age, and that's exactly what the course and mentorship are built to rebuild." },
    { q: "Can I really retrain around school hours and family life?", a: "Yes. The course is fully online and fully self-paced. No fixed class times, no commute, no childcare requirements for study. Practical units are video-assessed at any gym. Most returners finish the full Level 2 + Level 3 in 8–16 weeks fitting study around school runs, bedtimes, and weekends." },
    { q: "I haven't studied in years. Will I cope with the assessments?", a: "Yes. Your personal tutor is assigned within 24 hours of enrolment and stays with you throughout. You submit each unit when you're ready and your tutor either passes it or sends it back with feedback on what to change, so a unit that isn't quite there yet comes back for another go rather than counting as a fail. Resubmissions are free if you ever need them." },
    { q: "Can I do this without ever going to a college or classroom?", a: "Yes, 100%. Theory is delivered online. Practical units are video-based: you film yourself coaching a real session at any local gym, and your tutor reviews the footage remotely. NCFE, Focus Awards, and Active IQ all accept video assessment. You never need to step into a classroom." },
    { q: "I want to coach women specifically. Is that realistic?", a: "It's one of the strongest niches in the UK market. Women-only training, postnatal recovery, midlife strength, perimenopausal fitness, and beginner confidence are all undersupplied and growing. Many female returner-PTs we work with build their entire client base on referrals from one school-gate network. The Mentorship Hub has a dedicated track on niching down." },
    { q: "What's the realistic income for a returner-PT in year one?", a: "Part-time around school hours, year one: £12K–£25K. Full-time self-employed after 2–3 years: £35K–£50K+. Group sessions (4–8 people) push hourly rates significantly higher, which is common with school-hall classes and postnatal groups. The Mentorship Hub teaches pricing, packaging, and how to fill a small but profitable client base rather than chasing volume." },
    { q: "When can I start, and what's the total cost?", a: `Start the moment you enrol. Full access opens immediately and your tutor introduces themselves within 24 hours. ${COURSE_PRICE_LABEL} covers NCFE Level 2 + Level 3, your tutor, the £500 Mentorship Hub, and our gym pipeline. You can pay it in full, or as ${MONTHLY_PAYMENTS} monthly payments of ${MONTHLY_PRICE_LABEL} with no interest.` },
  ],
  close: {
    eyebrow: "Two ways back",
    heading: { lead: "Pick whichever feels", gold: "kinder to you today." },
    intro: "No wrong answer. Both routes have the same person waiting at the other end of them.",
    footnote: "No commitment · Supportive route built for parents and returners · Cancel anytime in your first 7 days",
  },
};

export const VSL_CONTENT: Record<VslAvatar, VslContent> = { starter, switcher, returner };
