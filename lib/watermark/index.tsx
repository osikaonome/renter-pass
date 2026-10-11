import "server-only";
import { ImageResponse } from "next/og";
import { PDFDocument, StandardFonts, degrees, rgb } from "pdf-lib";
import sharp from "sharp";

export type WatermarkInfo = {
  requesterName: string;
  linkLabel: string;
  date: Date;
};

export function watermarkText({ requesterName, linkLabel, date }: WatermarkInfo): string {
  const day = date.toLocaleDateString("en-IE", { day: "numeric", month: "short", year: "numeric" });
  return `Shared with ${requesterName} · ${linkLabel} · ${day} · via RenterPass`;
}

/**
 * Re-render a stored document with a visible watermark. The original bytes are
 * never sent to the viewer: images are decoded and re-encoded (dropping EXIF and
 * anything hidden in the file), and PDFs are rebuilt page by page as embedded
 * graphics, which drops scripts, forms, attachments and annotations.
 */
export async function renderWatermarked(
  bytes: Uint8Array,
  mimeType: string,
  info: WatermarkInfo,
): Promise<{ body: Uint8Array; contentType: string }> {
  const text = watermarkText(info);
  if (mimeType === "application/pdf") {
    return { body: await watermarkPdf(bytes, text), contentType: "application/pdf" };
  }
  return { body: await watermarkImage(bytes, text), contentType: "image/jpeg" };
}

const MAX_IMAGE_EDGE = 2000;

async function watermarkImage(bytes: Uint8Array, text: string): Promise<Uint8Array> {
  const base = sharp(bytes, { limitInputPixels: 50_000_000 })
    .rotate() // apply EXIF orientation before it's stripped
    .resize({ width: MAX_IMAGE_EDGE, height: MAX_IMAGE_EDGE, fit: "inside", withoutEnlargement: true });
  const { data, info } = await base.toBuffer({ resolveWithObject: true });

  // The overlay is drawn by next/og, which ships its own font, so this works in
  // serverless functions that have no system fonts installed.
  const overlay = await renderOverlay(text, info.width, info.height);

  const out = await sharp(data)
    .composite([{ input: overlay, top: 0, left: 0 }])
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();
  return new Uint8Array(out);
}

async function renderOverlay(text: string, width: number, height: number): Promise<Buffer> {
  const fontSize = Math.max(14, Math.round(Math.min(width, height) / 28));
  const rows = Math.ceil(height / (fontSize * 5)) + 2;

  const response = new ImageResponse(
    (
      <div style={{ width, height, display: "flex", position: "relative", overflow: "hidden" }}>
        <div
          style={{
            position: "absolute",
            top: -height / 2,
            left: -width / 2,
            width: width * 2,
            height: height * 2,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-around",
            transform: "rotate(-30deg)",
          }}
        >
          {Array.from({ length: rows * 2 }, (_, i) => (
            <div key={i} style={{ display: "flex", fontSize, color: "rgba(180, 30, 30, 0.28)", whiteSpace: "nowrap" }}>
              {`${text}     ${text}     ${text}`}
            </div>
          ))}
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            padding: fontSize / 2,
            fontSize: fontSize * 0.8,
            color: "#ffffff",
            backgroundColor: "rgba(120, 20, 20, 0.75)",
          }}
        >
          {text}
        </div>
      </div>
    ),
    { width, height },
  );
  return Buffer.from(await response.arrayBuffer());
}

// Standard PDF fonts only cover WinAnsi; replace anything else so a name in
// another script can't make rendering throw.
function winAnsiSafe(text: string): string {
  return text.replace(/·/g, "-").replace(/[^\x20-\x7e\xa0-\xff]/g, "?");
}

async function watermarkPdf(bytes: Uint8Array, rawText: string): Promise<Uint8Array> {
  const text = winAnsiSafe(rawText);
  const source = await PDFDocument.load(bytes, { ignoreEncryption: false, updateMetadata: false });
  const out = await PDFDocument.create({ updateMetadata: false });
  const font = await out.embedFont(StandardFonts.Helvetica);
  for (const sourcePage of source.getPages()) {
    const { width, height } = sourcePage.getSize();
    const target = out.addPage([width, height]);
    // Blank pages have no content stream, and pdf-lib can't embed those.
    if (sourcePage.node.Contents()) {
      const embedded = await out.embedPage(sourcePage);
      target.drawPage(embedded, { x: 0, y: 0, width, height });
    }

    const size = Math.max(10, Math.min(width, height) / 30);
    const textWidth = font.widthOfTextAtSize(text, size);
    const stepY = size * 6;
    for (let y = -height; y < height * 2; y += stepY) {
      for (let x = -width; x < width * 2; x += textWidth + size * 4) {
        target.drawText(text, {
          x,
          y,
          size,
          font,
          color: rgb(0.7, 0.12, 0.12),
          opacity: 0.25,
          rotate: degrees(30),
        });
      }
    }
    target.drawRectangle({ x: 0, y: 0, width, height: size * 2, color: rgb(0.47, 0.08, 0.08), opacity: 0.8 });
    target.drawText(text, { x: size, y: size * 0.6, size: size * 0.8, font, color: rgb(1, 1, 1) });
  }

  out.setTitle("Watermarked document");
  out.setProducer("RenterPass");
  return out.save();
}
