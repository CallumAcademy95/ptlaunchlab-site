import { CheckCircle2 } from 'lucide-react';

interface ProcessCardProps {
  number: number;
  label: string;
  labelColor: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  sectionTitle: string;
  items: string[];
  accentColor: string;
}

export function ProcessCard({
  number,
  label,
  labelColor,
  icon,
  title,
  description,
  sectionTitle,
  items,
  accentColor
}: ProcessCardProps) {
  return (
    <div className="bg-gradient-to-b from-[#0F3E66] to-[#0D3559] border border-[rgba(255,255,255,0.08)] rounded-2xl p-8 h-full flex flex-col shadow-sm">
      {/* Top Label */}
      <div className="flex items-center justify-between mb-6">
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-sm"
          style={{ backgroundColor: `${labelColor}15`, border: `1px solid ${labelColor}30` }}
        >
          {icon}
          <span className="text-sm" style={{ color: labelColor }}>{label}</span>
        </div>
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-sm backdrop-blur-sm"
          style={{ backgroundColor: `${accentColor}20`, color: accentColor, border: `1px solid ${accentColor}30` }}
        >
          {number}
        </div>
      </div>

      {/* Title and Description */}
      <h3 className="text-2xl text-white mb-4">{title}</h3>
      <p className="text-[#D6DEE6] mb-6 leading-relaxed">{description}</p>

      {/* Divider */}
      <div className="h-[1px] bg-[rgba(255,255,255,0.08)] mb-6"></div>

      {/* Section */}
      <h4 className="text-[#9FB3C8] text-sm uppercase tracking-wide mb-4">
        {sectionTitle}
      </h4>

      {/* Items List */}
      <ul className="space-y-3 flex-1">
        {items.map((item, index) => (
          <li key={index} className="flex items-start gap-3">
            <div className="mt-0.5 text-sm" style={{ color: accentColor }}>
              →
            </div>
            <span className="text-[#D6DEE6]">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}