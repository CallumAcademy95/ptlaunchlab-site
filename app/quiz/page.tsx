import type { Metadata } from 'next';
import { Suspense } from 'react';
import QuizApp from './QuizApp';

export const metadata: Metadata = {
  alternates: { canonical: "https://ptlaunchlab.co.uk/quiz" },
  title: 'What Type of PT Are You? — PT Launch Lab Career Quiz',
  description:
    'Answer 5 quick questions and discover which personal training career path suits you best. On-floor PT, online coach, hybrid — find out in under 2 minutes.',
};

// QuizApp uses useSearchParams() to read the ?avatar= pre-tag from the
// cold-traffic landing pages, which requires a Suspense boundary in App
// Router. Fallback is a blank page-coloured div to avoid layout flash.
export default function QuizPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-base" />}>
      <QuizApp />
    </Suspense>
  );
}
