interface StepCardProps {
  number: number;
  title: string;
  description: string;
}

export function StepCard({ number, title, description }: StepCardProps) {
  return (
    <div className="bg-card border border-white/[0.07] rounded-2xl p-8 text-center">
      <div className="w-14 h-14 rounded-full bg-gold/15 border border-gold/30 text-gold font-display font-extrabold text-2xl flex items-center justify-center mx-auto mb-6">
        {number}
      </div>
      <h3 className="text-2xl text-white mb-4 font-bold">{title}</h3>
      <p className="text-soft/70 leading-relaxed">{description}</p>
    </div>
  );
}
