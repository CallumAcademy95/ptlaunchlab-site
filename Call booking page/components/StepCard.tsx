interface StepCardProps {
  number: number;
  title: string;
  description: string;
}

export function StepCard({ number, title, description }: StepCardProps) {
  return (
    <div className="bg-gradient-to-b from-[#0F3E66] to-[#0D3559] border border-[rgba(255,255,255,0.08)] rounded-2xl p-8 text-center shadow-sm">
      <div className="w-14 h-14 rounded-full bg-[rgba(255,212,0,0.2)] border border-[rgba(255,212,0,0.3)] text-[#FFD400] flex items-center justify-center text-2xl mx-auto mb-6">
        {number}
      </div>
      <h3 className="text-2xl text-white mb-4 font-bold">{title}</h3>
      <p className="text-[#D6DEE6] leading-relaxed">
        {description}
      </p>
    </div>
  );
}