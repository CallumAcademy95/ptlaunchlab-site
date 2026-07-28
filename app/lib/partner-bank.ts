// Partner bank details — reading, masking, and change notification.
//
// Kept out of PartnerRecord on purpose. If the account number rode along on
// every session lookup it would eventually get rendered by accident; making it
// a separate, explicit call means every place that touches it is deliberate.

import { Resend } from "resend";
import { getSupabaseAdmin } from "./supabase-admin";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "info@ptlaunchlab.co.uk";

export interface BankDetails {
  accountName: string | null;
  sortCode: string | null;
  accountNumber: string | null;
  updatedAt: string | null;
}

/** What a partner or admin sees by default: enough to recognise, not enough to use. */
export interface MaskedBankDetails {
  accountName: string | null;
  sortCodeMasked: string | null;
  accountNumberMasked: string | null;
  updatedAt: string | null;
  isSet: boolean;
}

export function maskBankDetails(d: BankDetails): MaskedBankDetails {
  return {
    accountName: d.accountName,
    sortCodeMasked: d.sortCode ? `••-••-${d.sortCode.slice(4)}` : null,
    accountNumberMasked: d.accountNumber ? `••••${d.accountNumber.slice(-4)}` : null,
    updatedAt: d.updatedAt,
    isSet: Boolean(d.sortCode && d.accountNumber),
  };
}

const COLUMNS =
  "bank_account_name, bank_sort_code, bank_account_number, bank_details_updated_at";

export async function getBankDetails(partnerId: string): Promise<BankDetails> {
  const { data, error } = await getSupabaseAdmin()
    .from("pp_partners")
    .select(COLUMNS)
    .eq("id", partnerId)
    .maybeSingle();

  if (error || !data) {
    if (error) console.error("[partner-bank] read failed:", error);
    return { accountName: null, sortCode: null, accountNumber: null, updatedAt: null };
  }
  const row = data as unknown as Record<string, string | null>;
  return {
    accountName: row.bank_account_name,
    sortCode: row.bank_sort_code,
    accountNumber: row.bank_account_number,
    updatedAt: row.bank_details_updated_at,
  };
}

export async function getMaskedBankDetails(partnerId: string): Promise<MaskedBankDetails> {
  return maskBankDetails(await getBankDetails(partnerId));
}

export interface SaveBankDetailsResult {
  ok: boolean;
  error?: string;
  /** True when details already existed and are being replaced, not set for the first time. */
  wasChange?: boolean;
}

/** Strip everything that isn't a digit — "12-34-56", "12 34 56" and "123456" are one sort code. */
const digits = (s: string) => s.replace(/\D/g, "");

export async function saveBankDetails(args: {
  partnerId: string;
  accountName: string;
  sortCode: string;
  accountNumber: string;
  /** The partner user making the change, or null when an admin does it. */
  updatedBy?: string | null;
  /** Where to warn about the change. Usually every login on the account. */
  notifyEmails?: string[];
  gymName: string;
}): Promise<SaveBankDetailsResult> {
  const accountName = args.accountName.trim();
  const sortCode = digits(args.sortCode);
  const accountNumber = digits(args.accountNumber);

  if (accountName.length < 2) return { ok: false, error: "Enter the name on the account." };
  if (sortCode.length !== 6) return { ok: false, error: "Sort code must be 6 digits." };
  if (accountNumber.length !== 8) return { ok: false, error: "Account number must be 8 digits." };

  const previous = await getBankDetails(args.partnerId);
  const wasChange = Boolean(previous.sortCode && previous.accountNumber);
  const unchanged =
    previous.sortCode === sortCode &&
    previous.accountNumber === accountNumber &&
    previous.accountName === accountName;

  const { error } = await getSupabaseAdmin()
    .from("pp_partners")
    .update({
      bank_account_name: accountName,
      bank_sort_code: sortCode,
      bank_account_number: accountNumber,
      bank_details_updated_at: new Date().toISOString(),
      bank_details_updated_by: args.updatedBy ?? null,
    })
    .eq("id", args.partnerId);

  if (error) {
    console.error("[partner-bank] save failed:", error);
    return { ok: false, error: "Could not save those details. Try again." };
  }

  // Notify only on a real change to an existing account, never on first entry —
  // there is nothing to warn about the first time, and a spurious "your bank
  // details were changed" email is exactly the sort of thing people learn to
  // ignore before the one that matters arrives.
  if (wasChange && !unchanged) {
    await notifyBankDetailsChanged({
      gymName: args.gymName,
      to: args.notifyEmails ?? [],
      previousMasked: maskBankDetails(previous),
      newMasked: maskBankDetails({ accountName, sortCode, accountNumber, updatedAt: null }),
      byAdmin: !args.updatedBy,
    });
  }

  return { ok: true, wasChange: wasChange && !unchanged };
}

async function notifyBankDetailsChanged(args: {
  gymName: string;
  to: string[];
  previousMasked: MaskedBankDetails;
  newMasked: MaskedBankDetails;
  byAdmin: boolean;
}): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[partner-bank] RESEND_API_KEY not set — bank change notification NOT sent.");
    return;
  }

  // The admin copy is not optional. If a partner account is compromised, the
  // partner's own alert may go to an inbox the attacker controls.
  const recipients = [...new Set([...args.to, ADMIN_EMAIL])].filter(Boolean);

  const html = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#061F36;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:24px 16px;">
    <div style="background:#072B4A;border-radius:12px 12px 0 0;padding:24px 28px;border-bottom:3px solid #F5C518;">
      <div style="font-size:20px;font-weight:800;color:#ffffff;">PT Launch Lab</div>
      <div style="font-size:13px;color:#8CA3BF;margin-top:4px;">Payment details changed</div>
    </div>
    <div style="background:#0A2A44;padding:28px;border-radius:0 0 12px 12px;">
      <p style="color:#8CA3BF;font-size:15px;line-height:1.6;margin:0 0 20px;">
        The bank details we hold for <strong style="color:#ffffff;">${args.gymName}</strong> were changed
        ${args.byAdmin ? "by PT Launch Lab" : "from the partner portal"}. Future commission will be paid to the new account.
      </p>
      <div style="background:#061F36;border:1px solid #1A3A5C;border-radius:10px;padding:20px;margin-bottom:20px;">
        <p style="color:#8CA3BF;font-size:13px;margin:0 0 6px;">Previous</p>
        <p style="color:#ffffff;font-size:15px;margin:0 0 14px;">${args.previousMasked.sortCodeMasked} · ${args.previousMasked.accountNumberMasked}</p>
        <p style="color:#8CA3BF;font-size:13px;margin:0 0 6px;">New</p>
        <p style="color:#ffffff;font-size:15px;font-weight:600;margin:0;">${args.newMasked.sortCodeMasked} · ${args.newMasked.accountNumberMasked}</p>
      </div>
      <p style="color:#F5C518;font-size:14px;line-height:1.6;margin:0;">
        <strong>If you didn't make this change, call us on 01977 365001 straight away.</strong>
        We'll hold any payment until it's confirmed.
      </p>
    </div>
  </div>
</body></html>`;

  try {
    await new Resend(process.env.RESEND_API_KEY).emails.send({
      from: "PT Launch Lab Partnerships <partnerships@ptlaunchlab.co.uk>",
      to: recipients,
      subject: `Payment details changed — ${args.gymName}`,
      html,
    });
  } catch (err) {
    console.error("[partner-bank] change notification failed:", err);
  }
}
