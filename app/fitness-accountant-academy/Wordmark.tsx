// The Fitness Accountant's logo (sent by Jay, Nov 2026). The PNG was cut from
// his black-background JPEG with the black made transparent, so it sits on
// any dark background.
import Image from "next/image";

export const TFA_BLUE = "#1E6EF0";

export function FitnessAccountantWordmark({ size = "lg" }: { size?: "sm" | "lg" }) {
  return (
    <Image
      src="/gym-logos/the-fitness-accountant.png"
      alt="The Fitness Accountant"
      width={1040}
      height={740}
      priority={size === "lg"}
      className={size === "lg" ? "w-44 md:w-56 h-auto" : "w-16 h-auto"}
    />
  );
}
