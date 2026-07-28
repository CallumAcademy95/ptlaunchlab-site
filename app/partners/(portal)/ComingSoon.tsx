/**
 * Placeholder for a portal section that is built but not yet populated.
 *
 * Deliberately states what will be here and when, rather than a bare "coming
 * soon" — a partner who signs in and finds four empty tabs assumes the whole
 * thing is abandoned.
 */
export default function ComingSoon({
  title,
  intro,
  bullets,
}: {
  title: string;
  intro: string;
  bullets: string[];
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-white font-bold text-xl mb-1">{title}</h2>
        <p className="text-soft text-sm leading-relaxed max-w-2xl">{intro}</p>
      </div>

      <div className="rounded-xl bg-card border border-white/10 p-6">
        <p className="text-gold text-[10px] font-bold tracking-widest uppercase mb-3">
          What&rsquo;s coming here
        </p>
        <ul className="space-y-2">
          {bullets.map((b) => (
            <li key={b} className="text-soft text-sm flex gap-3">
              <span aria-hidden className="text-gold">•</span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className="text-soft text-xs">
        Need any of this sooner? Email{" "}
        <a href="mailto:info@ptlaunchlab.co.uk" className="text-gold hover:underline">
          info@ptlaunchlab.co.uk
        </a>{" "}
        and we&rsquo;ll send it over directly.
      </p>
    </div>
  );
}
