import ComingSoon from "../ComingSoon";

export default function SalesPage() {
  return (
    <ComingSoon
      title="Enrolments"
      intro="Every learner who enrols through your academy link, as it happens — no waiting for a monthly summary."
      bullets={[
        "Learner name and enrolment date for each referral",
        "Whether they paid in full or are on an instalment plan, and how far through they are",
        "The commission on each enrolment, and whether it has been released yet",
        "Filters by month and status, with running totals",
      ]}
    />
  );
}
