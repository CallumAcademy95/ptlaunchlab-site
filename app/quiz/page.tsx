import type { Metadata } from 'next';
import QuizApp from './QuizApp';

export const metadata: Metadata = {
  title: 'What Type of PT Are You? — PT Launch Lab Career Quiz',
  description:
    'Answer 5 quick questions and discover which personal training career path suits you best. On-floor PT, online coach, hybrid — find out in under 2 minutes.',
};

export default function QuizPage() {
  return <QuizApp />;
}
