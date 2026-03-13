'use client';

import { useState } from 'react';
import Image from 'next/image';
import { questions, calculateResult, QuizOption, ResultKey } from './quiz-config';
import ResultScreen from './ResultScreen';

// ─── Color tokens (matching success.signup-lauchlab.co.uk) ───────────────────
// bg-deep:   #091524  — main page background
// bg-nav:    #0F2040  — header / nav bar
// bg-card:   #112035  — card / input backgrounds
// bg-hover:  #1A3558  — hover state on cards
// yellow:    #F5C518  — primary CTA
// text-muted:#8CA3BF  — secondary text (blue-tinted)
// text-dim:  #4A6280  — very muted text
// ─────────────────────────────────────────────────────────────────────────────

type Screen = 'intro' | 'question' | 'email' | 'submitting' | 'result';

export default function QuizApp() {
  const [screen, setScreen]               = useState<Screen>('intro');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers]             = useState<QuizOption[]>([]);
  const [selected, setSelected]           = useState<QuizOption | null>(null);
  const [name, setName]                   = useState('');
  const [phone, setPhone]                 = useState('');
  const [email, setEmail]                 = useState('');
  const [emailError, setEmailError]       = useState('');
  const [result, setResult]               = useState<ResultKey | null>(null);
  const [animKey, setAnimKey]             = useState(0);

  const bump = () => setAnimKey((k) => k + 1);

  // ── Navigation ───────────────────────────────────────────────────────────

  const handleStart = () => {
    setScreen('question');
    setQuestionIndex(0);
    setAnswers([]);
    setSelected(null);
    bump();
  };

  const handleSelect = (option: QuizOption) => setSelected(option);

  const handleContinue = () => {
    if (!selected) return;
    const newAnswers = [...answers, selected];
    setAnswers(newAnswers);
    setSelected(null);
    bump();

    if (questionIndex < questions.length - 1) {
      setQuestionIndex((i) => i + 1);
    } else {
      setScreen('email');
    }
  };

  const handleBack = () => {
    bump();
    if (screen === 'email') {
      setAnswers((prev) => prev.slice(0, -1));
      setSelected(null);
      setQuestionIndex(questions.length - 1);
      setScreen('question');
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

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim())         { setEmailError('Please enter your full name.'); return; }
    if (!phone.trim())        { setEmailError('Please enter your mobile number.'); return; }
    if (!email.includes('@')) { setEmailError('Please enter a valid email address.'); return; }
    setEmailError('');
    setScreen('submitting');

    const calcResult = calculateResult(answers);
    setResult(calcResult);

    try {
      await fetch('/api/quiz-submission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:    name.trim(),
          phone:   phone.trim(),
          email:   email.trim().toLowerCase(),
          result:  calcResult,
          answers: answers.map((a) => ({ label: a.label })),
        }),
      });
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
    setResult(null);
    bump();
  };

  // ── Progress ─────────────────────────────────────────────────────────────

  const progressPct =
    screen === 'intro'    ? 0 :
    screen === 'question' ? (questionIndex / questions.length) * 100 :
    100;

  const currentQuestion = questions[questionIndex];

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#0D1F35] to-[#091524]">
      {/* Subtle blue glow blobs */}
      <div className="fixed -left-48 top-0 w-[600px] h-[600px] rounded-full bg-[#1A4A8A] opacity-[0.12] blur-3xl pointer-events-none" />
      <div className="fixed -right-32 bottom-0 w-[500px] h-[500px] rounded-full bg-[#0F3060] opacity-[0.15] blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-3 bg-[#0F2040] border-b border-white/5">
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
        <span className="text-[#8CA3BF] text-sm">Career Path Quiz</span>
      </header>

      {/* Progress bar */}
      {screen !== 'intro' && (
        <div className="relative z-10 h-1 bg-white/5 w-full">
          <div
            className="h-full bg-[#F5C518] transition-all duration-500 ease-out"
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
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#F5C518]/30 bg-[#112035] mb-8">
                <span className="text-[#F5C518] text-xs font-semibold tracking-widest uppercase">
                  Free Career Quiz
                </span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-bold text-white leading-[1.1] mb-6">
                Discover Your<br />
                <span className="text-[#F5C518]">PT Career Path</span>
              </h1>

              <p className="text-[#8CA3BF] text-lg max-w-lg mx-auto mb-8 leading-relaxed">
                Answer 5 quick questions and find out exactly which personal
                training career suits you best — and what to do next.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-2 text-[#4A6280] text-sm mb-6">
                <span>5 questions</span>
                <span className="text-white/10">·</span>
                <span>Under 2 minutes</span>
                <span className="text-white/10">·</span>
                <span>Free personalised results</span>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-4 text-[#4A6280] text-xs mb-10">
                <span>✓ Guaranteed gym interviews</span>
                <span>✓ 500+ PTs hired by our team</span>
                <span>✓ 30+ years industry experience</span>
              </div>

              <button
                onClick={handleStart}
                className="px-10 py-4 rounded-full bg-[#F5C518] text-[#091524] font-bold text-base hover:brightness-110 transition-all shadow-lg shadow-[#F5C518]/20"
              >
                Find My Path →
              </button>
            </div>
          )}

          {/* ── QUESTION ── */}
          {screen === 'question' && currentQuestion && (
            <div>
              {/* Top nav */}
              <div className="flex items-center justify-between mb-8">
                <button
                  onClick={handleBack}
                  className="text-[#8CA3BF] hover:text-white transition-colors text-sm flex items-center gap-1"
                >
                  ← Back
                </button>
                <span className="text-[#4A6280] text-sm">
                  {questionIndex + 1} / {questions.length}
                </span>
              </div>

              {/* Question */}
              <h2 className="text-xl sm:text-3xl font-bold text-white mb-6 leading-tight">
                {currentQuestion.question}
              </h2>

              {/* Options */}
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
                          ? 'border-[#F5C518] bg-[#F5C518]/10 text-white scale-[1.01]'
                          : 'border-white/10 bg-[#112035] text-[#8CA3BF] hover:border-[#2A5080] hover:text-white hover:bg-[#1A3558]'
                        }
                      `}
                    >
                      <span className={`mr-3 text-sm ${isSelected ? 'text-[#F5C518]' : 'text-[#4A6280]'}`}>
                        {isSelected ? '●' : '○'}
                      </span>
                      {option.label}
                    </button>
                  );
                })}
              </div>

              {/* Continue */}
              <div
                className={`mt-6 transition-all duration-300 ${
                  selected ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
                }`}
              >
                <button
                  onClick={handleContinue}
                  className="w-full py-4 rounded-full bg-[#F5C518] text-[#091524] font-bold text-base hover:brightness-110 transition-all shadow-lg shadow-[#F5C518]/20"
                >
                  {questionIndex === questions.length - 1 ? 'See My Results →' : 'Continue →'}
                </button>
              </div>
            </div>
          )}

          {/* ── EMAIL CAPTURE ── */}
          {screen === 'email' && (
            <div>
              <div className="mb-8">
                <button
                  onClick={handleBack}
                  className="text-[#8CA3BF] hover:text-white transition-colors text-sm flex items-center gap-1 mb-6"
                >
                  ← Back
                </button>

                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#F5C518]/30 bg-[#112035] mb-5">
                  <span className="text-[#F5C518] text-xs font-semibold tracking-widest uppercase">
                    Almost there
                  </span>
                </div>

                <h2 className="text-2xl sm:text-4xl font-bold text-white mb-4 leading-tight">
                  Your results are<br />
                  <span className="text-[#F5C518]">ready.</span>
                </h2>
                <p className="text-[#8CA3BF] leading-relaxed">
                  Enter your details to unlock your personalised PT career path
                  and your free guide.
                </p>
              </div>

              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#8CA3BF] mb-2">
                    Full name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Jamie Clarke"
                    className="w-full px-5 py-4 rounded-xl bg-[#112035] border border-white/10 text-white placeholder-[#4A6280] focus:outline-none focus:border-[#F5C518] transition-colors text-base"
                    required
                    autoComplete="name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#8CA3BF] mb-2">
                    Mobile number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 07700 900000"
                    className="w-full px-5 py-4 rounded-xl bg-[#112035] border border-white/10 text-white placeholder-[#4A6280] focus:outline-none focus:border-[#F5C518] transition-colors text-base"
                    required
                    autoComplete="tel"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#8CA3BF] mb-2">
                    Email address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@email.com"
                    className="w-full px-5 py-4 rounded-xl bg-[#112035] border border-white/10 text-white placeholder-[#4A6280] focus:outline-none focus:border-[#F5C518] transition-colors text-base"
                    required
                    autoComplete="email"
                  />
                </div>

                {emailError && (
                  <p className="text-red-400 text-sm">{emailError}</p>
                )}

                <button
                  type="submit"
                  className="w-full py-4 rounded-full bg-[#F5C518] text-[#091524] font-bold text-base hover:brightness-110 transition-all shadow-lg shadow-[#F5C518]/20 mt-2"
                >
                  Show My Results →
                </button>

                <p className="text-[#4A6280] text-xs text-center pt-1">
                  No spam. We'll send relevant PT tips and resources only. Unsubscribe anytime.
                </p>
              </form>
            </div>
          )}

          {/* ── SUBMITTING ── */}
          {screen === 'submitting' && (
            <div className="text-center py-20">
              <div className="w-12 h-12 border-4 border-[#F5C518]/20 border-t-[#F5C518] rounded-full animate-spin mx-auto mb-6" />
              <p className="text-[#8CA3BF]">Calculating your results…</p>
            </div>
          )}

          {/* ── RESULT ── */}
          {screen === 'result' && result && (
            <ResultScreen
              name={name}
              resultKey={result}
              onStartOver={handleStartOver}
            />
          )}
        </div>
      </main>
    </div>
  );
}
