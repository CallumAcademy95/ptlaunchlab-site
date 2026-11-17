// The Fitness Accountant's wordmark, drawn in type until his logo file is in
// the repo. His logo (Nov 2026) is white lettering on black with a blue arrow
// and blue rules either side of "THE"; this copies that lockup. When the PNG
// arrives, put it at public/gym-logos/the-fitness-accountant.png and swap this
// component's body for an <Image>.

export const TFA_BLUE = "#1E6EF0";

export function FitnessAccountantWordmark({ size = "lg" }: { size?: "sm" | "lg" }) {
  const big = size === "lg";
  return (
    <div className={`inline-flex flex-col items-center text-white leading-none ${big ? "gap-1.5" : "gap-0.5"}`} aria-label="The Fitness Accountant">
      <div className={`flex items-center w-full ${big ? "gap-3" : "gap-1.5"}`} aria-hidden>
        <span className={`flex-1 ${big ? "h-[3px]" : "h-[2px]"}`} style={{ backgroundColor: TFA_BLUE }} />
        <span className={`font-bold tracking-[0.4em] ${big ? "text-xs" : "text-[7px]"}`}>THE</span>
        <span className={`flex-1 ${big ? "h-[3px]" : "h-[2px]"}`} style={{ backgroundColor: TFA_BLUE }} />
      </div>
      <span aria-hidden className={`font-display font-black tracking-[0.06em] ${big ? "text-3xl md:text-4xl" : "text-base"}`}>FITNESS</span>
      <span aria-hidden className={`font-medium tracking-[0.32em] ${big ? "text-xs md:text-sm" : "text-[7px]"}`}>ACCOUNTANT</span>
    </div>
  );
}
