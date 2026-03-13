import type { Metadata } from "next";
import EnrolmentFlow from "./EnrolmentFlow";

export const metadata: Metadata = {
  title: "Enrol | PT Launch Lab",
  description: "Start your Level 2 & 3 Personal Training qualification with PT Launch Lab. Complete your enrolment in minutes.",
};

export default function EnrolPage() {
  return <EnrolmentFlow />;
}
