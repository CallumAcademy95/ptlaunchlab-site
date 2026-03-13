import { Star } from 'lucide-react';

interface TestimonialCardProps {
  quote: string;
  author: string;
}

export function TestimonialCard({ quote, author }: TestimonialCardProps) {
  return (
    <div className="bg-gradient-to-b from-[#0F3E66] to-[#0D3559] border border-[rgba(255,255,255,0.08)] rounded-2xl p-8 shadow-sm">
      {/* 5 Star Rating */}
      <div className="flex gap-1 mb-4">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className="w-5 h-5 fill-[#FFD400] text-[#FFD400]" />
        ))}
      </div>

      {/* Quote */}
      <p className="text-[#D6DEE6] text-lg leading-relaxed mb-6">
        "{quote}"
      </p>

      {/* Author */}
      <p className="text-[#9FB3C8] text-sm">
        — {author}, Google Review
      </p>
    </div>
  );
}
