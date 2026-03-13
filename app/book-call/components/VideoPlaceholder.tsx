export function VideoPlaceholder() {
  return (
    <div className="relative w-full rounded-2xl overflow-hidden shadow-lg border border-[rgba(255,255,255,0.08)]" style={{ paddingBottom: "56.25%" }}>
      <iframe
        className="absolute top-0 left-0 w-full h-full"
        src="https://www.youtube.com/embed/TsOwZ1E2Syg"
        title="PT Launch Lab Video"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
