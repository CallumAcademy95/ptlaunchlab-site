interface PrimaryButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export function PrimaryButton({ children, onClick, className = '' }: PrimaryButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-8 py-4 bg-[#FFD400] hover:bg-[#F5C400] text-[#072B4A] rounded-full transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.3)] ${className}`}
    >
      {children}
    </button>
  );
}