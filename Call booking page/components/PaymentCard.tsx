import { PrimaryButton } from './PrimaryButton';

interface PaymentCardProps {
  title: string;
  price: string;
  description: string;
  features: string[];
  buttonText: string;
  disclaimer?: string;
  financeDisclaimer?: boolean;
  recommended?: boolean;
}

export function PaymentCard({
  title,
  price,
  description,
  features,
  buttonText,
  disclaimer,
  financeDisclaimer,
  recommended = false
}: PaymentCardProps) {
  return (
    <div className={`bg-gradient-to-b from-[#0F3E66] to-[#0D3559] border ${recommended ? 'border-[#FFD400] border-2 shadow-xl shadow-[#FFD400]/10' : 'border-[rgba(255,255,255,0.08)]'} rounded-2xl p-8 flex flex-col h-full ${recommended ? 'relative' : ''}`}>
      {recommended && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#FFD400] text-[#072B4A] px-5 py-1.5 rounded-full text-sm shadow-lg">
          Recommended
        </div>
      )}
      <h3 className="text-2xl text-white mb-2">{title}</h3>
      <div className="text-4xl text-white mb-2">{price}</div>
      <p className="text-[#9FB3C8] mb-6">{description}</p>

      <ul className="space-y-3 mb-8 flex-1">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-3">
            <span className="text-[#35C6A4] mt-1">✓</span>
            <span className="text-[#D6DEE6]">{feature}</span>
          </li>
        ))}
      </ul>

      <PrimaryButton className="w-full">{buttonText}</PrimaryButton>

      {/* Standard disclaimer inside card */}
      {disclaimer && !financeDisclaimer && (
        <div className="mt-6 pt-6 border-t border-[rgba(255,255,255,0.06)]">
          <p className="text-[#9FB3C8] text-xs leading-relaxed">
            {disclaimer}
          </p>
        </div>
      )}

      {/* Finance disclaimer - separate box below button */}
      {financeDisclaimer && disclaimer && (
        <div className="mt-4 p-4 bg-[rgba(0,0,0,0.3)] rounded-lg border border-[rgba(255,255,255,0.05)]">
          <p className="text-[#9FB3C8] text-xs leading-relaxed">
            {disclaimer}
          </p>
        </div>
      )}
    </div>
  );
}