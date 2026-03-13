interface ContentCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export function ContentCard({ children, className = '', hover = true }: ContentCardProps) {
  return (
    <div
      className={`bg-gradient-to-b from-[#0F3E66] to-[#0D3559] border border-[rgba(255,255,255,0.08)] rounded-2xl p-8 shadow-sm ${
        hover ? 'hover:shadow-lg hover:-translate-y-1 transition-all duration-300' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}