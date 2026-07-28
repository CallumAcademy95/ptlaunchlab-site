import ComingSoon from "../ComingSoon";

export default function PaymentsPage() {
  return (
    <ComingSoon
      title="Payments"
      intro="What you're owed, what's been paid, and when the rest becomes payable. Payments continue to be made by bank transfer as they are today."
      bullets={[
        "Your outstanding balance and the date each amount is released",
        "A record of every payment made, with its bank reference",
        "Which enrolments each payment covered",
      ]}
    />
  );
}
