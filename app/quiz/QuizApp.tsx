'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { questions, calculateResult, QuizOption, ResultKey } from './quiz-config';
import ResultScreen from './ResultScreen';
import { trackEvent } from '@/app/lib/gtag';
import { useFormSecurity } from '@/app/lib/security/client';

type Avatar = 'starter' | 'switcher' | 'returner';
const VALID_AVATARS: ReadonlyArray<Avatar> = ['starter', 'switcher', 'returner'];

// Capture split into two single-field screens to reduce friction:
// - 'mobile' : mobile only (highest-value field, peak sunk-cost moment)
// - 'email'  : email + name (lighter "intro yourself" ask after mobile is in)
// The previous all-in-one form had a higher drop-off because users saw
// three required fields at once. Splitting preserves the same data capture
// while feeling like two small steps instead of one daunting wall.
type Screen = 'intro' | 'question' | 'mobile' | 'email' | 'submitting' | 'result';

export default function QuizApp() {
  const [screen, setScreen]               = useState<Screen>('intro');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers]             = useState<QuizOption[]>([]);
  const [selected, setSelected]           = useState<QuizOption | null>(null);
  const [name, setName]                   = useState('');
  const [phone, setPhone]                 = useState('');
  const [email, setEmail]                 = useState('');
  const [formError, setFormError]         = useState('');
  const [result, setResult]               = useState<ResultKey | null>(null);
  const [animKey, setAnimKey]             = useState(0);
  const sec = useFormSecurity();

  // Avatar pre-tag from cold-traffic avatar landing pages (Starter / Switcher
  // / Returner). Used for segmented retargeting + tailored result-page copy.
  // Quiz still works untouched if visitor arrives without the param.
  const searchParams = useSearchParams();
  const rawAvatar = searchParams.get('avatar');
  const avatar: Avatar | undefined = VALID_AVATARS.includes(rawAvatar as Avatar)
    ? (rawAvatar as Avatar)
    : undefined;

  const bump = () => setAnimKey((k) => k + 1);

  const handleStart = () => {
    setScreen('question');
    setQuestionIndex(0);
    setAnswers([]);
    setSelected(null);
    bump();
    trackEvent('quiz_start', avatar ? { avatar } : undefined);
  };

  const handleSelect = (option: QuizOption) => setSelected(option);

  const handleContinue = () => {
    if (!selected) return;
    const newAnswers = [...answers, selected];
    setAnswers(newAnswers);
    setSelected(null);
    bump();

    trackEvent('quiz_question_answered', {
      question_index: questionIndex + 1,
      question_total: questions.length,
      answer_label: selected.label,
      ...(avatar ? { avatar } : {}),
    });

    if (questionIndex < questions.length - 1) {
      setQuestionIndex((i) => i + 1);
    } else {
      setScreen('mobile');
    }
  };

  const handleBack = () => {
    bump();
    if (screen === 'email') {
      setFormError('');
      setScreen('mobile');
      return;
    }
    if (screen === 'mobile') {
      setFormError('');
      setScreen('question');
      setQuestionIndex(questions.length - 1);
      // Roll back the last answer so the user lands on Q5 with no selection,
      // matching the back-from-email behaviour the previous flow had.
      setAnswers((prev) => prev.slice(0, -1));
      setSelected(null);
      return;
    }
    if (questionIndex === 0) {
      setAnswers([]);
      setSelected(null);
      setScreen('intro');
      return;
    }
    setAnswers((prev) => prev.slice(0, -1));
    setSelected(null);
    setQuestionIndex((i) => i - 1);
  };

  const handleMobileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = phone.trim();
    // Loose UK mobile validation — must contain at least 9 digits.
    // We don't want to bounce legitimate numbers on strict formatting.
    if (trimmed.replace(/\D/g, '').length < 9) {
      setFormError('Please enter a valid mobile number.');
      return;
    }
    setFormError('');
    trackEvent('quiz_mobile_captured', avatar ? { avatar } : undefined);
    setScreen('email');
    bump();
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim())         { setFormError('Please enter your full name.'); return; }
    if (!email.includes('@')) { setFormError('Please enter a valid email address.'); return; }
    setFormError('');

    trackEvent('quiz_email_captured', avatar ? { avatar } : undefined);

    setScreen('submitting');

    const calcResult = calculateResult(answers);
    setResult(calcResult);

    // Generate a shared event_id so the server-side CAPI Lead event (fired in
    // /api/quiz-submission) and the browser fbq Lead below dedup on Meta's
    // side. Meta merges duplicates by event_name + event_id within 7 days.
    const eventId =
      typeof window !== 'undefined' && window.crypto?.randomUUID
        ? window.crypto.randomUUID()
        : `quiz-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    try {
      await fetch('/api/quiz-submission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:    name.trim(),
          phone:   phone.trim(),
          email:   email.trim().toLowerCase(),
          result:  calcResult,
          event_id: eventId,
          ...(avatar ? { avatar } : {}),
          answers: answers.map((a) => ({ label: a.label })),
          [sec.SEC_KEY]: sec.payload(),
        }),
      });
      trackEvent('quiz_complete', { quiz_result: calcResult, ...(avatar ? { avatar } : {}) });
      if (typeof window !== 'undefined' && (window as any).fbq) {
        // 4th argument carries the eventID for dedup with the server CAPI event
        (window as any).fbq(
          'track',
          'Lead',
          { content_name: calcResult, ...(avatar ? { content_category: avatar } : {}) },
          { eventID: eventId },
        );
      }
    } catch {
      // Non-blocking — user still gets their result if the save fails
    }

    setScreen('result');
    bump();
  };

  const handleStartOver = () => {
    setScreen('intro');
    setQuestionIndex(0);
    setAnswers([]);
    setSelected(null);
    setName('');
    setPhone('');
    setEmail('');
    setFormError('');
    setResult(null);
    bump();
  };

  const progressPct =
    screen === 'intro'    ? 0 :
    screen === 'question' ? (questionIndex / questions.length) * 100 :
    100;

  const currentQuestion = questions[questionIndex];

  return (
    <div className="min-h-screen flex flex-col bg-base">
      {/* Background glows */}
      <div className="fixed -left-48 top-0 w-[600px] h-[600px] rounded-full bg-gold opacity-[0.04] blur-3xl pointer-events-none" />
      <div className="fixed -right-32 bottom-0 w-[500px] h-[500px] rounded-full bg-blue opacity-[0.05] blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-3 bg-deep border-b border-white/[0.06]">
        <a href="/">
          <Image
            src="/logo.png"
            alt="PT Launch Lab"
            width={120}
            height={48}
            className="h-12 w-auto object-contain"
            priority
          />
        </a>
        <span className="text-soft/50 text-sm">Career Path Quiz</span>
      </header>

      {/* Progress bar */}
      {screen !== 'intro' && (
        <div className="relative z-10 h-1 bg-white/[0.05] w-full">
          <div
            className="h-full bg-gold transition-all duration-500 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      )}

      {/* Main content */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-6 sm:py-12">
        <div key={animKey} className="w-full max-w-2xl animate-fade-in-up">

          {/* ── INTRO ── */}
          {screen === 'intro' && (
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-gold/30 bg-surface mb-8">
                <span className="text-gold text-xs font-semibold tracking-widest uppercase">
                  Free Career Quiz
                </span>
              </div>

              <h1 className="font-display font-extrabold text-3xl sm:text-5xl text-white leading-none tracking-tight mb-6">
                Discover Your<br />
                <span className="text-gold">PT Career Path</span>
              </h1>

              <p className="text-soft/60 text-lg max-w-lg mx-auto mb-8 leading-relaxed">
                Answer 5 quick questions and find out exactly which personal
                training career suits you best — and what to do next.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-2 text-faint text-sm mb-6">
                <span>5 questions</span>
                <span className="text-white/10">·</span>
                <span>Under 2 minutes</span>
                <span className="text-white/10">·</span>
                <span>Free personalised results</span>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-4 text-faint text-xs mb-10">
                <span className="flex items-center gap-1.5">
                  <svg viewBox="0 0 14 14" fill="none" className="w-3 h-3 text-gold">
                    <path d="M2 7l3.5 3.5L12 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Guaranteed gym interviews
                </span>
                <span className="flex items-center gap-1.5">
                  <svg viewBox="0 0 14 14" fill="none" className="w-3 h-3 text-gold">
                    <path d="M2 7l3.5 3.5L12 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  500+ PTs hired by our team
                </span>
                <span className="flex items-center gap-1.5">
                  <svg viewBox="0 0 14 14" fill="none" className="w-3 h-3 text-gold">
                    <path d="M2 7l3.5 3.5L12 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  30+ years industry experience
                </span>
              </div>

              <button
                onClick={handleStart}
                className="px-10 py-4 rounded-full bg-gold text-deep font-bold text-base hover:brightness-110 transition-all shadow-lg shadow-gold/20"
              >
                Find My Path →
              </button>
            </div>
          )}

          {/* ── QUESTION ── */}
          {screen === 'question' && currentQuestion && (
            <div>
              <div className="flex items-center justify-between mb-8">
                <button
                  onClick={handleBack}
                  className="text-soft/50 hover:text-white transition-colors text-sm flex items-center gap-1"
                >
                  ← Back
                </button>
                <span className="text-faint text-sm">
                  {questionIndex + 1} / {questions.length}
                </span>
              </div>

              <h2 className="font-display font-extrabold text-xl sm:text-3xl text-white leading-tight tracking-tight mb-6">
                {currentQuestion.question}
              </h2>

              <div
                className={`grid gap-3 ${
                  currentQuestion.options.length >= 4 ? 'sm:grid-cols-2' : 'grid-cols-1'
                }`}
              >
                {currentQuestion.options.map((option) => {
                  const isSelected = selected?.label === option.label;
                  return (
                    <button
                      key={option.label}
                      onClick={() => handleSelect(option)}
                      className={`
                        w-full text-left px-5 py-4 rounded-xl border-2 font-medium transition-all duration-150
                        ${isSelected
                          ? 'border-gold bg-gold/10 text-white scale-[1.01]'
                          : 'border-white/[0.08] bg-card text-soft/60 hover:border-gold/30 hover:text-white hover:bg-card/80'
                        }
                      `}
                    >
                      <span className={`mr-3 text-sm ${isSelected ? 'text-gold' : 'text-faint'}`}>
                        {isSelected ? '●' : '○'}
                      </span>
                      {option.label}
                    </button>
                  );
                })}
              </div>

              <div
                className={`mt-6 transition-all duration-300 ${
                  selected ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
                }`}
              >
                <button
                  onClick={handleContinue}
                  className="w-full py-4 rounded-full bg-gold text-deep font-bold text-base hover:brightness-110 transition-all shadow-lg shadow-gold/20"
                >
                  {questionIndex === questions.length - 1 ? 'See My Results →' : 'Continue →'}
                </button>
              </div>
            </div>
          )}

          {/* ── MOBILE CAPTURE (Step 1 of 2) ── */}
          {screen === 'mobile' && (
            <div>
              <div className="mb-8">
                <button
                  onClick={handleBack}
                  className="text-soft/50 hover:text-white transition-colors text-sm flex items-center gap-1 mb-6"
                >
                  ← Back
                </button>

                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-gold/30 bg-surface mb-5">
                  <span className="text-gold text-xs font-semibold tracking-widest uppercase">
                    Step 1 of 2 · Almost there
                  </span>
                </div>

                <h2 className="font-display font-extrabold text-2xl sm:text-4xl text-white leading-none tracking-tight mb-4">
                  Your path is<br />
                  <span className="text-gold">ready to unlock.</span>
                </h2>
                <p className="text-soft/60 leading-relaxed">
                  Pop your mobile in below. We&apos;ll send a quick WhatsApp with your personalised path so it&apos;s saved for you.
                </p>
              </div>

              <form onSubmit={handleMobileSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-soft/60 mb-2">
                    Mobile number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 07700 900000"
                    className="w-full px-5 py-4 rounded-xl bg-card border border-white/[0.08] text-white placeholder-faint focus:outline-none focus:border-gold transition-colors text-base"
                    required
                    autoComplete="tel"
                    inputMode="tel"
                    autoFocus
                  />
                </div>

                {formError && (
                  <p className="text-red-400 text-sm">{formError}</p>
                )}

                <button
                  type="submit"
                  className="w-full py-4 rounded-full bg-gold text-deep font-bold text-base hover:brightness-110 transition-all shadow-lg shadow-gold/20 mt-2"
                >
                  Continue →
                </button>

                <p className="text-faint text-xs text-center pt-1">
                  We&apos;ll message you within a few hours during business hours. No spam, ever.
                </p>
              </form>
            </div>
          )}

          {/* ── EMAIL + NAME CAPTURE (Step 2 of 2) ── */}
          {screen === 'email' && (
            <div>
              <div className="mb-8">
                <button
                  onClick={handleBack}
                  className="text-soft/50 hover:text-white transition-colors text-sm flex items-center gap-1 mb-6"
                >
                  ← Back
                </button>

                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-gold/30 bg-surface mb-5">
                  <span className="text-gold text-xs font-semibold tracking-widest uppercase">
                    Step 2 of 2 · Last bit
                  </span>
                </div>

                <h2 className="font-display font-extrabold text-2xl sm:text-4xl text-white leading-none tracking-tight mb-4">
                  Where do we send<br />
                  <span className="text-gold">your free guide?</span>
                </h2>
                <p className="text-soft/60 leading-relaxed">
                  We&apos;ll email your personalised guide as a PDF backup so you&apos;ve got it forever, not just in WhatsApp.
                </p>
              </div>

              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <sec.Honeypot />
                <div>
                  <label className="block text-sm font-medium text-soft/60 mb-2">
                    Full name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Jamie Clarke"
                    className="w-full px-5 py-4 rounded-xl bg-card border border-white/[0.08] text-white placeholder-faint focus:outline-none focus:border-gold transition-colors text-base"
                    required
                    autoComplete="name"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-soft/60 mb-2">
                    Email address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@email.com"
                    className="w-full px-5 py-4 rounded-xl bg-card border border-white/[0.08] text-white placeholder-faint focus:outline-none focus:border-gold transition-colors text-base"
                    required
                    autoComplete="email"
                  />
                </div>

                {formError && (
                  <p className="text-red-400 text-sm">{formError}</p>
                )}

                <button
                  type="submit"
                  className="w-full py-4 rounded-full bg-gold text-deep font-bold text-base hover:brightness-110 transition-all shadow-lg shadow-gold/20 mt-2"
                >
                  Show My Results →
                </button>

                <p className="text-faint text-xs text-center pt-1">
                  No spam. We&apos;ll send relevant PT tips and resources only. Unsubscribe anytime.
                </p>
              </form>
            </div>
          )}

          {/* ── SUBMITTING ── */}
          {screen === 'submitting' && (
            <div className="text-center py-20">
              <div className="w-12 h-12 border-4 border-gold/20 border-t-gold rounded-full animate-spin mx-auto mb-6" />
              <p className="text-soft/60">Calculating your results…</p>
            </div>
          )}

          {/* ── RESULT ── */}
          {screen === 'result' && result && (
            <ResultScreen
              name={name}
              resultKey={result}
              avatar={avatar}
              onStartOver={handleStartOver}
            />
          )}
        </div>
      </main>
    </div>
  );
}
