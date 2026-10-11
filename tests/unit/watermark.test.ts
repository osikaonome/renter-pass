import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { renderWatermarked, watermarkText } from "@/lib/watermark";

const info = { requesterName: "Seán Ó Briain 王", linkLabel: "Rathmines 2-bed", date: new Date("2026-10-10T12:00:00Z") };

describe("watermark", () => {
  it("names the requester, the link and the date", () => {
    const text = watermarkText(info);
    expect(text).toContain("Seán Ó Briain");
    expect(text).toContain("Rathmines 2-bed");
    expect(text).toContain("2026");
  });

  it("rebuilds PDFs page by page, even with non-Latin names", async () => {
    const source = await PDFDocument.create();
    source.addPage([595, 842]).drawText("Employment letter", { x: 50, y: 700 });
    source.addPage([595, 842]); // blank page: no content stream
    const bytes = await source.save();

    const { body, contentType } = await renderWatermarked(bytes, "application/pdf", info);
    expect(contentType).toBe("application/pdf");
    const out = await PDFDocument.load(body, { updateMetadata: false });
    expect(out.getPageCount()).toBe(2);
    expect(out.getProducer()).toBe("RenterPass");
  });
});
