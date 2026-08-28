import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Unsubscribe | PT Launch Lab',
  description: 'Unsubscribe from PT Launch Lab emails.',
  robots: { index: false, follow: false },
};

type Props = {
  searchParams: Promise<{ email?: string; done?: string; error?: string }>;
};

const shell =
  'min-h-[70vh] flex items-center justify-center px-5 py-16 bg-[#070D1B]';
const card =
  'w-full max-w-md rounded-xl border border-[#1A3A5C] bg-[#102342] p-7 sm:p-9 text-center';

export default async function UnsubscribePage({ searchParams }: Props) {
  const params = await searchParams;
  const email = (params.email || '').trim();

  if (params.done) {
    return (
      <main className={shell}>
        <div className={card}>
          <h1 className="text-2xl font-bold text-white mb-3">You&apos;re unsubscribed</h1>
          <p className="text-[#8FA4BD] leading-relaxed mb-6">
            You won&apos;t receive any more marketing emails from PT Launch Lab. If you&apos;re
            enrolled on a course, you&apos;ll still get essential emails about your studies.
          </p>
          <a
            href="/"
            className="inline-block rounded-lg bg-[#F5C518] px-5 py-2.5 font-semibold text-[#070D1B] hover:brightness-95 transition"
          >
            Back to the site
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className={shell}>
      <div className={card}>
        <h1 className="text-2xl font-bold text-white mb-3">Unsubscribe</h1>

        {params.error && (
          <p
            role="alert"
            className="mb-5 rounded-lg border border-[#7F1D1D] bg-[#2A1215] px-4 py-3 text-sm text-[#FCA5A5]"
          >
            That didn&apos;t work. Check the address and try again, or email{' '}
            <a href="mailto:info@ptlaunchlab.co.uk" className="underline">
              info@ptlaunchlab.co.uk
            </a>{' '}
            and we&apos;ll remove you by hand.
          </p>
        )}

        <p className="text-[#8FA4BD] leading-relaxed mb-6">
          {email
            ? 'Confirm the address below and we’ll stop emailing you.'
            : 'Enter the address you’d like us to stop emailing.'}
        </p>

        <form method="POST" action="/api/unsubscribe" className="space-y-4 text-left">
          <label htmlFor="email" className="block text-sm font-medium text-white">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            defaultValue={email}
            placeholder="you@example.com"
            className="w-full rounded-lg border border-[#1A3A5C] bg-[#070D1B] px-4 py-3 text-white placeholder:text-[#4D6580] focus:border-[#F5C518] focus:outline-none"
          />
          <button
            type="submit"
            className="w-full rounded-lg bg-[#F5C518] px-5 py-3 font-semibold text-[#070D1B] hover:brightness-95 transition"
          >
            Unsubscribe me
          </button>
        </form>

        <p className="mt-6 text-xs text-[#8FA4BD]">
          Changed your mind? Just close this page &mdash; nothing happens until you press the
          button.
        </p>
      </div>
    </main>
  );
}
