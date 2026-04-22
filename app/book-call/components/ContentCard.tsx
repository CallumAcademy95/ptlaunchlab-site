interface ContentCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export function ContentCard({ children, className = "", hover = true }: ContentCardProps) {
  return (
    <div
      className={`bg-card border border-white/[0.07] rounded-2xl p-8 ${
        hover ? "hover:shadow-lg hover:-translate-y-1 transition-all duration-300" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}
