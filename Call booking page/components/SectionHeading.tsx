interface SectionHeadingProps {
  children: React.ReactNode;
  highlightWord?: string;
  centered?: boolean;
  className?: string;
}

export function SectionHeading({ children, highlightWord, centered = true, className = '' }: SectionHeadingProps) {
  // If there's a highlight word, split the text and highlight it
  const renderText = () => {
    if (!highlightWord || typeof children !== 'string') {
      return children;
    }

    const parts = children.split(highlightWord);
    return (
      <>
        {parts[0]}
        <span className="text-[#FFD400]">{highlightWord}</span>
        {parts[1]}
      </>
    );
  };

  return (
    <div className={`${centered ? 'text-center' : ''} ${className}`}>
      <h2 className="text-5xl md:text-6xl text-white leading-tight inline-block">
        {renderText()}
      </h2>
      <div className={`mt-4 h-[3px] w-[50px] bg-[#FFD400] ${centered ? 'mx-auto' : ''}`}></div>
    </div>
  );
}
