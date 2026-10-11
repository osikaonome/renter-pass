import { ImageResponse } from "next/og";
import { getPublicLink } from "./data";

export const alt = "Rental application on RenterPass";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Link preview for WhatsApp, email and so on: names, headline and photo only.
 * Never shows budget, documents or contact details.
 */
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const link = await getPublicLink(slug);

  const names = link ? link.members.map((m) => m.firstName).join(" & ") : "RenterPass";
  const headline = link ? (link.household ? `Applying together · ${link.household.name}` : link.members[0]?.headline) : "";
  const photo = link?.members[0]?.photoUrl;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: "#f6f7f5", color: "#1c2321" }}>
        <div style={{ display: "flex", fontSize: 34, fontWeight: 700, color: "#1f6f5c" }}>RenterPass</div>
        <div style={{ display: "flex", alignItems: "center", gap: 48 }}>
          {photo && !link?.household && (
            <img src={photo} width={220} height={220} style={{ borderRadius: 110, objectFit: "cover" }} alt="" />
          )}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 76, fontWeight: 700 }}>{link ? `${names}'s application` : "Link not available"}</div>
            {headline && <div style={{ fontSize: 38, color: "#56625d", marginTop: 16, maxWidth: 820 }}>{headline}</div>}
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 28, color: "#56625d" }}>Profile · documents available on request</div>
      </div>
    ),
    size,
  );
}
