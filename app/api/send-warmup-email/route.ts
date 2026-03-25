import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { Resend } from 'resend';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
const resend = new Resend(process.env.RESEND_API_KEY!);

const PATH_CONTEXT: Record<string, { title: string; focus: string; fear: string; outcome: string }> = {
  onFloor: {
    title: 'On-Floor PT',
    focus: 'face-to-face coaching in a gym environment',
    fear: 'leaving job security and getting first clients',
    outcome: 'full client roster and doing work that means something',
  },
  online: {
    title: 'Online Coach',
    focus: 'building an online coaching business with freedom and scale',
    fear: 'the unknown of going online and getting clients without a gym floor',
    outcome: 'coaching from anywhere with recurring income and freedom',
  },
  hybrid: {
    title: 'Hybrid Coach',
    focus: 'combining in-person clients with online income',
    fear: 'the cost and uncertainty of making the leap',
    outcome: 'multiple income streams without being stuck in a gym 40 hours a week',
  },
  alreadyQualified: {
    title: 'Qualified PT who needs direction',
    focus: 'getting traction after already qualifying — more clients and consistent income',
    fear: 'having done the hard part but still not making it work',
    outcome: 'finally earning consistently and building something that lasts',
  },
};

async function generateEmail(
  emailNumber: 1 | 2 | 3,
  name: string,
  result: string,
  answers: string[],
): Promise<{ subject: string; html: string }> {
  const path = PATH_CONTEXT[result] ?? PATH_CONTEXT.onFloor;
  const firstName = name.split(' ')[0];
  const answersText = answers.join(' | ');

  const VIDEO_URL = 'https://www.youtube.com/watch?v=jBT_ez9-aAk';
  const CALL_URL = 'https://ptlaunchlab.co.uk/book-call';

  const prompts: Record<number, string> = {
    1: `You are Miles, founder of PT Launch Lab — a PT education and mentorship company in the UK. Write a warm, direct, honest email to ${firstName} who just completed a career path quiz. Their result was: ${path.title}. Their quiz answers were: ${answersText}.

Write Email 1 of 3 in a nurture sequence. This email:
- Lands immediately after they see their quiz result
- Feels personal, not like a newsletter. Like Miles is talking directly to them
- Acknowledges what they said in the quiz and their motivations and fears
- Reinforces why the ${path.title} path is right for them specifically
- Briefly explains what PT Launch Lab does and why it's different (mentorship plus qualification plus guaranteed gym interviews, built by PTs who've done £500K independently)
- End with a natural sentence directing them to the two buttons below the email: one to watch the free 90 Day PT Plan on YouTube, one to book a free strategy call. Do not write out any URLs. Just reference them naturally as "the buttons below" or "the links below".
- Ends with a personal sign-off from Miles

IMPORTANT WRITING RULES:
- Do NOT use dashes or hyphens anywhere in the email. Not em dashes, not hyphens between words, nothing.
- Write like a real person texting a friend. Short sentences. Conversational.
- No bullet points. No lists. Just paragraphs.
- No fake urgency. No "limited spots". No exclamation marks unless it genuinely feels natural.

Tone: honest, direct, warm.
Length: 200-280 words max.

Return JSON: { "subject": "...", "body": "..." }
Body: plain paragraphs separated by blank lines. No HTML. No dashes of any kind.`,

    2: `You are Miles, founder of PT Launch Lab. Write Email 2 of 3 in a nurture sequence to ${firstName}, who took our career quiz and got: ${path.title}. Their answers: ${answersText}.

This email lands on Day 2. It should:
- Open with a short story about a real client who was in the same position as ${firstName} (similar fears: ${path.fear}) and how it worked out for them. Make the story feel real and specific. Give the person a name, a before and after.
- Connect the story back to ${firstName}'s situation naturally
- End by directing them to the two buttons below the email: the free 90 Day PT Plan video and the book a call option. Do not write out any URLs. Reference them as "the links below" or "the buttons below".
- No hard sell

IMPORTANT WRITING RULES:
- Do NOT use dashes or hyphens anywhere. Not em dashes, not hyphens between words, nothing.
- Write like a real person. Short sentences. No corporate language.
- No bullet points or lists. Just paragraphs.

Tone: story-first, warm, real. Like Miles is checking in.
Length: 200-260 words.

Return JSON: { "subject": "...", "body": "..." }
Body: plain paragraphs separated by blank lines. No HTML. No dashes of any kind.`,

    3: `You are Miles, founder of PT Launch Lab. Write Email 3 of 3 in a nurture sequence to ${firstName}, who took our quiz (result: ${path.title}). Their answers: ${answersText}.

This email lands on Day 4. It is the direct ask. It should:
- Open acknowledging they have had a few days to think about it
- Be honest: the call is 15 minutes, it is free, there is no pressure to do anything
- Tell them exactly what happens on the call: we look at where they are, where they want to be, and whether we are the right fit to help. If we are not, we will say so.
- Address the most likely objection for their path (${path.fear}) directly and briefly
- End by pointing them to the two buttons below the email: the free 90 Day PT Plan video and the strategy call. Do not write out any URLs. Just say something like "both links are below".
- If they are not ready that is fine but don't let uncertainty make the decision for them
- Sign off from Miles

IMPORTANT WRITING RULES:
- Do NOT use dashes or hyphens anywhere. Not em dashes, not hyphens, nothing.
- Write like a real person. Direct. Conversational. Short sentences.
- No bullet points or lists. Just paragraphs.

Tone: direct, no fluff, honest. Final email so it should feel like a genuine conversation.
Length: 180-240 words.

Return JSON: { "subject": "...", "body": "..." }
Body: plain paragraphs separated by blank lines. No HTML. No dashes of any kind.`,
  };

  const response = await anthropic.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompts[emailNumber] }],
  });

  const text = (response.content[0] as any).text;
  const json = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] || '{}');

  // Strip any remaining dashes or raw URLs Claude might have snuck in
  const cleanBody = (json.body as string)
    .replace(/\u2014/g, ' ')               // em dash
    .replace(/\u2013/g, ' ')               // en dash
    .replace(/ - /g, ' ')                  // spaced hyphen
    .replace(/https?:\/\/\S+/g, '')        // raw URLs — buttons handle these
    .replace(/\s{2,}/g, ' ')               // collapse double spaces left behind
    .trim()

  // Convert plain text body to simple HTML with CTA buttons
  const html = `
    <div style="font-family: Georgia, serif; max-width: 580px; margin: 0 auto; padding: 32px 24px; color: #1a1a1a; line-height: 1.7; font-size: 16px;">
      ${cleanBody
        .split('\n\n')
        .filter((p: string) => p.trim())
        .map((p: string) => `<p style="margin: 0 0 20px 0;">${p.trim()}</p>`)
        .join('')}

      <div style="margin: 36px 0; display: flex; flex-direction: column; gap: 12px;">
        <a href="${VIDEO_URL}"
          style="display: block; text-align: center; background: #F5C518; color: #072B4A; font-weight: bold; padding: 16px 24px; border-radius: 50px; text-decoration: none; font-size: 15px;">
          Watch the Free 90 Day PT Plan
        </a>
        <a href="${CALL_URL}"
          style="display: block; text-align: center; background: #072B4A; color: #ffffff; font-weight: bold; padding: 16px 24px; border-radius: 50px; text-decoration: none; font-size: 15px;">
          Book a Free Strategy Call
        </a>
      </div>

      <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #e5e5e5; font-size: 13px; color: #888;">
        <p style="margin: 0;">PT Launch Lab · <a href="https://ptlaunchlab.co.uk" style="color: #888;">ptlaunchlab.co.uk</a></p>
        <p style="margin: 4px 0 0 0;"><a href="https://ptlaunchlab.co.uk/unsubscribe" style="color: #888;">Unsubscribe</a></p>
      </div>
    </div>
  `;

  return { subject: json.subject, html };
}

export async function POST(req: NextRequest) {
  try {
    const { name, email, result, answers } = await req.json();
    if (!name || !email || !result) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const now = new Date();
    const day2 = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
    const day4 = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000);

    // Generate all 3 emails in parallel
    const [email1, email2, email3] = await Promise.all([
      generateEmail(1, name, result, answers),
      generateEmail(2, name, result, answers),
      generateEmail(3, name, result, answers),
    ]);

    // Send all 3 via Resend — Email 1 immediate, 2 and 3 scheduled
    await Promise.all([
      resend.emails.send({
        from: 'Miles @ PT Launch Lab <miles@ptlaunchlab.co.uk>',
        to: email,
        subject: email1.subject,
        html: email1.html,
      }),
      resend.emails.send({
        from: 'Miles @ PT Launch Lab <miles@ptlaunchlab.co.uk>',
        to: email,
        subject: email2.subject,
        html: email2.html,
        scheduledAt: day2.toISOString(),
      }),
      resend.emails.send({
        from: 'Miles @ PT Launch Lab <miles@ptlaunchlab.co.uk>',
        to: email,
        subject: email3.subject,
        html: email3.html,
        scheduledAt: day4.toISOString(),
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[send-warmup-email]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
