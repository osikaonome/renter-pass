// Detects data renters usually shouldn't hand to a landlord. Shared by the client
// (warnings while typing) and the server (scanning uploaded PDFs).

export type SensitiveFlag = "pps_number" | "iban" | "card_number";

// Irish PPS number: 7 digits followed by one or two letters (e.g. 1234567T, 1234567TW).
const PPS = /\b\d{7}\s?[A-W][A-IW]?\b/gi;
// Irish IBAN, with or without spaces: IE + 2 check digits + 4-letter bank code + 14 digits.
const IBAN = /\bIE\s?\d{2}\s?[A-Z]{4}\s?(?:\d\s?){14}\b/gi;
// 13–19 digit card numbers, validated with Luhn to cut false positives.
const CARD = /\b(?:\d[ -]?){13,19}\b/g;

function luhn(digits: string): boolean {
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = Number(digits[i]);
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    double = !double;
  }
  return sum % 10 === 0;
}

export function detectSensitive(text: string): SensitiveFlag[] {
  const flags = new Set<SensitiveFlag>();
  if (text.match(PPS)) flags.add("pps_number");
  if (text.match(IBAN)) flags.add("iban");
  for (const match of text.match(CARD) ?? []) {
    const digits = match.replace(/\D/g, "");
    if (digits.length >= 13 && luhn(digits)) {
      flags.add("card_number");
      break;
    }
  }
  return [...flags];
}

export const SENSITIVE_FLAG_COPY: Record<SensitiveFlag, string> = {
  pps_number:
    "This looks like it contains a PPS number. Landlords don't need your PPS number to assess an application. Consider redacting it.",
  iban: "This looks like it contains bank account details (IBAN). Consider redacting them before sharing.",
  card_number: "This looks like it contains a payment card number. Please redact it before sharing.",
};
