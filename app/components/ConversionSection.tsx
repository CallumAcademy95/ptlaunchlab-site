import PriceBlock from "@/app/components/home/PriceBlock";

/** The shared "two ways to pay" section: the home page's pay-in-full-first price block.
 *  Keeps the old #book-call anchor and ConversionSection's legacy GA events. */
export default function ConversionSection() {
  return (
    <div id="book-call">
      <PriceBlock source="conversion" legacy="conversion" />
    </div>
  );
}
