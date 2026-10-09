import { permanentRedirect } from "next/navigation";

// /youtube-discount/thank-you — RETIRED with /youtube-discount. See that page.
export default function Page() {
  permanentRedirect("/courses");
}
