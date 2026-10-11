import { describe, expect, it } from "vitest";
import { detectSensitive } from "@/lib/security/sensitive";
import { sniffMimeType } from "@/lib/security/file-type";
import { generateOtp, generateSlug, sign, verify } from "@/lib/security/tokens";

describe("detectSensitive", () => {
  it("flags PPS numbers with one or two letters", () => {
    expect(detectSensitive("PPS: 1234567T")).toContain("pps_number");
    expect(detectSensitive("my pps is 1234567TW thanks")).toContain("pps_number");
  });

  it("flags Irish IBANs with or without spaces", () => {
    expect(detectSensitive("IE29AIBK93115212345678")).toContain("iban");
    expect(detectSensitive("IE29 AIBK 9311 5212 3456 78")).toContain("iban");
  });

  it("flags Luhn-valid card numbers only", () => {
    expect(detectSensitive("4111 1111 1111 1111")).toContain("card_number");
    expect(detectSensitive("4111 1111 1111 1112")).not.toContain("card_number");
  });

  it("ignores ordinary text, dates and phone numbers", () => {
    expect(detectSensitive("Moving in on 2026-11-01, budget €1,800, call 087 123 4567")).toEqual([]);
  });
});

describe("sniffMimeType", () => {
  const bytes = (...b: number[]) => new Uint8Array([...b, ...new Array(16).fill(0)]);

  it("recognises allowed types by magic bytes", () => {
    expect(sniffMimeType(bytes(0x25, 0x50, 0x44, 0x46, 0x2d))).toBe("application/pdf");
    expect(sniffMimeType(bytes(0xff, 0xd8, 0xff, 0xe0))).toBe("image/jpeg");
    expect(sniffMimeType(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a))).toBe("image/png");
    expect(sniffMimeType(bytes(0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50))).toBe("image/webp");
  });

  it("rejects anything else, whatever its extension claims", () => {
    expect(sniffMimeType(new TextEncoder().encode("<html><script>"))).toBeNull();
    expect(sniffMimeType(bytes(0x50, 0x4b, 0x03, 0x04))).toBeNull(); // zip / docx
  });
});

describe("tokens", () => {
  it("generates unguessable slugs without look-alike characters", () => {
    const slugs = new Set(Array.from({ length: 1000 }, () => generateSlug()));
    expect(slugs.size).toBe(1000);
    for (const slug of slugs) expect(slug).toMatch(/^[a-km-np-z2-9]{14}$/);
  });

  it("generates 6-digit codes", () => {
    for (let i = 0; i < 100; i++) expect(generateOtp()).toMatch(/^\d{6}$/);
  });

  it("verifies signed payloads and rejects tampering", () => {
    const token = sign({ linkId: "a", exp: 1 }, "secret");
    expect(verify(token, "secret")).toEqual({ linkId: "a", exp: 1 });
    expect(verify(token, "other-secret")).toBeNull();
    const [body, sig] = token.split(".");
    const forged = Buffer.from(JSON.stringify({ linkId: "b", exp: 1 })).toString("base64url");
    expect(verify(`${forged}.${sig}`, "secret")).toBeNull();
    expect(verify(`${body}.`, "secret")).toBeNull();
    expect(verify(undefined, "secret")).toBeNull();
  });
});
