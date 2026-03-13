import { NextRequest, NextResponse } from "next/server";

const ZAPIER_WEBHOOK = process.env.ENROLMENT_ZAPIER_WEBHOOK_URL!;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { learnerDetails: l, learningDetails: ln, agreement: a, paymentChoice, submittedAt } = body;

    if (!l?.fullName || !l?.email) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const payload = {
      // Meta
      submitted_at:        new Date(submittedAt).toLocaleString("en-GB", { timeZone: "Europe/London" }),
      payment_choice:      paymentChoice === "full" ? "Full Payment — £1,399" : "Deposit Plan — £599 + 5×£200",

      // Personal
      title:               l.title,
      full_name:           l.fullName,
      date_of_birth:       l.dateOfBirth,
      gender:              l.gender,
      national_insurance:  l.nationalInsurance,
      mobile:              l.mobile,
      email:               l.email,
      address_line_1:      l.addressLine1,
      address_line_2:      l.addressLine2 || "",
      town:                l.town,
      county:              l.county || "",
      postcode:            l.postcode,

      // Learning
      heard_about:         ln.heardAbout,
      highest_qualification: ln.highestQualification,
      gcse_english:        ln.gcseEnglish || "N/A",
      gcse_maths:          ln.gcseMaths   || "N/A",
      gcse_ict:            ln.gcseICT     || "N/A",
      employment_status:   ln.employmentStatus,

      // Agreement
      signature_type:      a.signatureType,
      signed_at:           new Date(a.signedAt).toLocaleString("en-GB", { timeZone: "Europe/London" }),
      details_accurate:    a.checkboxes.detailsAccurate      ? "Yes" : "No",
      self_funded:         a.checkboxes.selfFunded            ? "Yes" : "No",
      cooling_off:         a.checkboxes.coolingOffUnderstood  ? "Yes" : "No",
      terms_agreed:        a.checkboxes.termsAgreed           ? "Yes" : "No",
      commit_to_learning:  a.checkboxes.commitToLearning      ? "Yes" : "No",
    };

    const res = await fetch(ZAPIER_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.error("Zapier webhook error:", res.status, await res.text());
      return NextResponse.json({ error: "Webhook failed" }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Enrolment API error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
